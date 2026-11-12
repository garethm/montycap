import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { lockPackages, attestationUrl, parseProvenance, compare, compareVersions, integrityToHex } from '../scripts/attestations.js';

const VITEST = { repository: 'github.com/vitest-dev/vitest', workflow: '.github/workflows/publish.yml', commit: 'aaa' };

function attestationResponse(statement) {
    const payload = Buffer.from(JSON.stringify(statement)).toString('base64');
    return {
        attestations: [
            { predicateType: 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1', bundle: {} },
            { predicateType: 'https://slsa.dev/provenance/v1', bundle: { dsseEnvelope: { payload } } },
        ],
    };
}

describe('lockPackages', () => {
    it('lists registry packages once each, including nested installs', () => {
        const lock = {
            packages: {
                '': { name: 'montycap' },
                'node_modules/ajv': { version: '8.20.0', resolved: 'https://registry.npmjs.org/ajv/-/ajv-8.20.0.tgz' },
                'node_modules/eslint/node_modules/ajv': { version: '6.15.0', resolved: 'https://registry.npmjs.org/ajv/-/ajv-6.15.0.tgz' },
                'node_modules/a/node_modules/ajv': { version: '6.15.0', resolved: 'https://registry.npmjs.org/ajv/-/ajv-6.15.0.tgz' },
                'node_modules/@types/ws': { version: '8.18.1', resolved: 'https://registry.npmjs.org/@types/ws/-/ws-8.18.1.tgz' },
                'node_modules/local': { link: true, resolved: 'packages/local' },
                'node_modules/forked': { version: '1.0.0', resolved: 'git+https://github.com/x/forked.git' },
            },
        };
        expect(lockPackages(lock).map(p => `${p.name}@${p.version}`))
            .toEqual(['@types/ws@8.18.1', 'ajv@6.15.0', 'ajv@8.20.0']);
    });
});

describe('attestationUrl', () => {
    const PREFIX = 'https://registry.npmjs.org/-/npm/v1/attestations/';

    it('encodes scoped package names', () => {
        expect(attestationUrl({ name: '@eslint/core', version: '1.2.1' })).toBe(`${PREFIX}%40eslint%2Fcore@1.2.1`);
    });

    it('keeps any name and version within a single path segment', () => {
        fc.assert(fc.property(fc.string(), fc.string(), (name, version) => {
            const segment = attestationUrl({ name, version }).slice(PREFIX.length);
            return !/[/?#]/.test(segment);
        }));
    });
});

describe('parseProvenance', () => {
    it('extracts repository, workflow, commit and digest from SLSA provenance', () => {
        const response = attestationResponse({
            subject: [{ name: 'pkg:npm/vitest@5.1.0', digest: { sha512: 'abc' } }],
            predicate: {
                buildDefinition: {
                    externalParameters: {
                        workflow: { repository: 'https://github.com/vitest-dev/vitest', path: '.github/workflows/publish.yml' },
                    },
                    resolvedDependencies: [{ uri: 'git+https://github.com/vitest-dev/vitest@refs/heads/main', digest: { gitCommit: 'aaa' } }],
                },
            },
        });
        expect(parseProvenance(response)).toEqual({ ...VITEST, digest: 'abc' });
    });

    it('falls back to the resolved source URI when there is no workflow', () => {
        const response = attestationResponse({
            subject: [],
            predicate: { buildDefinition: { resolvedDependencies: [{ uri: 'git+https://gitlab.com/group/project@refs/heads/main' }] } },
        });
        expect(parseProvenance(response).repository).toBe('gitlab.com/group/project');
    });

    it('returns null when there is no SLSA provenance', () => {
        expect(parseProvenance({ attestations: [] })).toBeNull();
    });
});

describe('integrityToHex', () => {
    it('converts an SRI sha512 value to the hex digest used in attestations', () => {
        const hex = 'ab'.repeat(64);
        expect(integrityToHex(`sha512-${Buffer.from(hex, 'hex').toString('base64')}`)).toBe(hex);
        expect(integrityToHex('sha1-abc')).toBeNull();
    });
});

describe('compareVersions', () => {
    const version = fc.tuple(fc.nat(50), fc.nat(50), fc.nat(50), fc.option(fc.constantFrom('alpha.1', 'beta.2', 'rc.10')))
        .map(([major, minor, patch, pre]) => `${major}.${minor}.${patch}${pre ? `-${pre}` : ''}`);

    it('is antisymmetric', () => {
        fc.assert(fc.property(version, version, (a, b) => Math.sign(compareVersions(a, b)) === -Math.sign(compareVersions(b, a))));
    });

    it('orders numerically and puts prereleases before their release', () => {
        expect(compareVersions('3.4.3', '5.0.1')).toBeLessThan(0);
        expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
        expect(compareVersions('2.0.0-rc.1', '2.0.0')).toBeLessThan(0);
    });
});

describe('compare', () => {
    it('reports nothing when the lock file matches the baseline', () => {
        const packages = { 'vitest@5.1.0': VITEST, 'prompts@2.4.2': null };
        expect(compare(packages, packages)).toEqual({ errors: [], notices: [] });
    });

    it('fails when a newer version loses provenance', () => {
        const { errors } = compare({ 'vitest@5.1.0': VITEST }, { 'vitest@5.1.1': null });
        expect(errors).toEqual(['vitest@5.1.1 has no provenance, but vitest@5.1.0 did']);
    });

    it('accepts an older version without provenance installed alongside a newer one with it', () => {
        const packages = { 'eslint-visitor-keys@3.4.3': null, 'eslint-visitor-keys@5.0.1': VITEST };
        expect(compare(packages, packages).errors).toEqual([]);
    });

    it('fails when the source repository changes', () => {
        const { errors } = compare({ 'vitest@5.1.0': VITEST }, { 'vitest@5.1.1': { ...VITEST, repository: 'github.com/someone/vitest' } });
        expect(errors).toHaveLength(1);
    });

    it('notes a changed publishing workflow without failing', () => {
        const { errors, notices } = compare({ 'vitest@5.1.0': VITEST }, { 'vitest@5.1.1': { ...VITEST, workflow: '.github/workflows/release.yml' } });
        expect(errors).toEqual([]);
        expect(notices).toContain('vitest@5.1.1 was published by .github/workflows/release.yml, but vitest@5.1.0 by .github/workflows/publish.yml');
    });

    it('notes packages added to or removed from the lock file', () => {
        const { errors, notices } = compare({ 'kleur@4.1.5': null }, { 'picocolors@1.1.1': null });
        expect(errors).toEqual([]);
        expect(notices).toEqual([
            'picocolors@1.1.1 is not in the baseline (no provenance)',
            'kleur@4.1.5 is in the baseline but no longer in the lock file',
        ]);
    });
});
