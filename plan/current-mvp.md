# OverStorm MVP

## Vision

OverStorm predicts which properties will likely require disaster restoration services before competitors know about them.

Instead of reacting to damage reports, restoration companies can proactively identify, prioritize, and contact high-value opportunities.

---

# Core User Flow

Storm Event

↓

Risk Analysis

↓

Revenue Opportunity Ranking

↓

Decision Maker Discovery

↓

AI Outreach

↓

Pipeline Dashboard

---

# MVP Success Criteria

A judge can:

1. Select a storm event
2. View affected properties
3. See risk score ranking
4. See expected revenue ranking
5. Find decision makers
6. Generate personalized outreach
7. Watch pipeline metrics update

Everything should happen within one dashboard.

---

# Architecture

Frontend

* Next.js
* Tailwind
* Mapbox

Backend

* Convex

AI

* OpenAI

Data Enrichment

* Fiber
* Orange Slice

---

# Modules

## Module 1 — Storm Intelligence

Purpose:

Identify potentially impacted areas.

Inputs:

* NOAA weather data
* Hurricane data
* Flood data

MVP Version:

Use static JSON data.

Output:

{
zipCode,
city,
stormRisk
}

---

## Module 2 — Property Risk Engine

Purpose:

Calculate building vulnerability.

Inputs:

* building age
* building type
* distance from coastline
* elevation

Output:

{
propertyId,
riskScore,
explanation
}

Risk score range:

0-100

---

## Module 3 — Revenue Opportunity Engine

Purpose:

Estimate opportunity value.

Formula:

Expected Revenue

=

Risk Score

×

Property Size

×

Service Value Multiplier

Output:

{
propertyId,
expectedRevenue,
priorityRank
}

Sort descending.

This becomes the core GTM list.

---

## Module 4 — Decision Maker Discovery

Purpose:

Find who should be contacted.

Provider:

Fiber

Output:

{
company,
contactName,
title,
email,
phone
}

---

## Module 5 — AI Outreach

Purpose:

Generate personalized outbound messages.

Provider:

OpenAI

Output:

Email
Call script
SMS

MVP only requires Email.

---

## Module 6 — Revenue Dashboard

Purpose:

Visualize GTM pipeline.

Metrics:

Properties Found

Contacts Found

Emails Generated

Responses

Meetings

Expected Pipeline Value

---

# Convex Data Model

storms

properties

riskScores

opportunities

contacts

outreach

pipelineMetrics

---

# Agent Pipeline

Storm Created

↓

Generate Risk Scores

↓

Generate Revenue Scores

↓

Find Contacts

↓

Generate Outreach

↓

Update Dashboard

Every stage should be represented as Convex actions.

---

# Demo Script

Step 1

Select Miami Storm

Step 2

View Risk Rankings

Step 3

Open Property

Step 4

View Revenue Opportunity

Step 5

Find Decision Maker

Step 6

Generate Outreach

Step 7

Dashboard Updates

End Result:

"We predict revenue before demand exists."