# Foundation: How the Tool Works and Why

This document explains the planning problem the tool addresses, the conceptual model it uses, and the reasoning behind the key design choices. Reading it first provides the needed context that will make the overall design make sense.

## The Planning Problem

Some programmes of work involve running the same process repeatedly, in parallel, across many instances — and the work is genuinely uncertain. A single instance might complete quickly and cleanly; another might turn out to be much more involved, require external responses, or trigger additional steps. The process is the same, but the outcomes vary widely.

A team planning such a programme needs answers to two questions:

- **How long will this take?** Given our team's capacity, when can we realistically expect to be done?
- **Do we have enough capacity?** Is the total effort within our allocated budget, or are we likely to run over?

Deterministic estimates — "each instance takes about X hours" — fail to capture the uncertainty. Average them and you get a median outcome that half the instances will exceed. Pad them and you lose the information about the range. What's actually needed is a model of the *distribution* of outcomes.

## Monte Carlo Simulation

Rather than producing a single estimate, the tool simulates the programme many times — typically 1,000 runs or more — with effort values drawn from statistical distributions on each run. Each run is one plausible version of how the programme might unfold. Across all runs, the tool builds up a distribution of outcomes: timelines, total effort, and week-by-week workload.

This distribution answers both planning questions directly. The P50 outcome (the median) is the most likely result. The P80 or P90 outcome is what a cautious planner should commit to. The over-capacity percentage tells you how often the total effort exceeds your budget across all simulations — a concrete risk figure rather than a gut feel.

## Tasks: Work and Wait

Each step in the process is modelled as a **task** with two distinct time components.

**Work effort** is the time your team actively spends on the task — hours of analysis, review, writing, or decision-making. This is the component that consumes your team's capacity.

**Wait time** is calendar time that passes while something external happens: a supplier responds to a questionnaire, a stakeholder reviews a document, a meeting slot becomes available. Wait time adds to the calendar duration of the programme but does not consume your team's capacity. The team is free to work on other instances during a wait.

Separating these matters because the two components affect planning in different ways. A task might require four hours of work but then sit for two weeks waiting for an external response. Treating those two weeks as "effort" would massively overstate the capacity cost; treating them as zero would understate the calendar timeline. Modelling them separately gives an accurate picture of both.

## Three-Point Estimation

For both work effort and wait time, you provide three estimates: **optimistic**, **expected**, and **pessimistic**. The tool fits a PERT distribution to these three points — a Beta distribution that clusters outcomes around the expected value but with a tail toward the pessimistic end, reflecting the asymmetric nature of real-world delays and overruns.

Three-point estimation is a practical way to capture expert knowledge under uncertainty. It asks a question you can actually answer ("what's the best case, most likely case, and worst case?") rather than asking for a full probability distribution. The range between your optimistic and pessimistic estimates directly represents how much you know about a given task — a narrow range reflects confidence; a wide range reflects genuine uncertainty.

## Optional Tasks

Not every task happens in every instance. Some steps are only needed in certain circumstances — a follow-up investigation that only happens when initial findings are concerning, or an escalation that only occurs when a risk exceeds a threshold. Each task carries a **skip probability**: the percentage of simulation runs in which that task is omitted entirely. A task with a 60% skip probability is absent from 60% of runs, reflecting the real-world frequency with which that step is needed.

## Programme Quantity

The same process often runs in parallel across many instances simultaneously — multiple suppliers being reviewed, multiple sites being assessed, multiple components being evaluated. The **programme quantity** parameter specifies how many parallel instances are simulated in each run.

All instances share the same weekly capacity constraint. If the team has 40 hours per week to dedicate to the programme and there are ten parallel instances, the scheduler has to fit all ten within that 40-hour window — it cannot pretend each instance gets 40 hours independently. This is what makes parallel programmes genuinely harder to plan than sequential ones: contention for shared capacity stretches the calendar even when the total effort looks manageable.

## Capacity: Budget and Throughput

The tool models capacity in two distinct ways because two distinct constraints apply to any programme.

**Available capacity** is the total person-hour budget allocated to the programme. It is a cumulative figure — the total hours the team is permitted to spend across the entire exercise. Exceeding it is a resource and cost problem.

**Weekly capacity** is the throughput rate — how many hours per week this team can dedicate to this programme. It is a scheduling constraint. Even if the total budget is ample, a low weekly capacity stretches the calendar: work queues up and cannot be completed any faster than the weekly rate allows.

These constraints bind independently. A team might have a generous total budget but a limited weekly allocation because the people involved have other commitments. In that case the programme will take longer on the calendar even though total effort is within budget. Both constraints need to be planned against.

## Reading the Results

The simulation produces a distribution of outcomes rather than a single number. The key outputs are:

**Effort percentiles** (P10, P50, P90, and the selected confidence value) describe the distribution of total person-hours across all simulation runs. P50 is the median; P90 means 90% of runs completed within that effort figure.

**Timeline percentiles** describe the same distribution for total calendar duration in business days.

**Over-capacity risk** is the percentage of simulation runs in which total effort exceeded the available capacity budget. A figure above 20% is a strong signal to revisit scope or increase capacity; below 5% represents a comfortable buffer.

**The workload chart** shows the average weekly hours required across the subset of simulations that fell near the selected confidence percentile. It reveals when during the programme the team will be most stretched, and which weeks are likely to exceed weekly capacity.

**The confidence level** is a planning choice, not a statistical fact. Choosing 80% means "I want a plan that works in 80% of plausible outcomes." A risk-tolerant team might use 70%; a team that cannot afford overruns might use 90%. The same simulation data supports any confidence level — adjust it to match your planning posture.
