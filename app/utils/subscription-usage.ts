import { Project } from "@/models/Project";
import { inferUsageLimitFromDescriptions, normalizeNonNegativeInt } from "@/app/utils/plan-usage";

type SubscriptionLike = {
    projectId?: unknown;
    projectName?: unknown;
    planName?: unknown;
    usageCount?: unknown;
    maxUsage?: unknown;
};

type PlanLike = {
    name?: unknown;
    maxUsage?: unknown;
    descriptions?: unknown;
};

export type ResolvedSubscriptionQuota = {
    usageCount: number;
    maxUsage: number;
    hasUsage: boolean;
    remaining: number | null;
    shouldPersistResolvedMaxUsage: boolean;
};

async function findLinkedPlan(sub: SubscriptionLike): Promise<PlanLike | null> {
    const projectId = typeof sub.projectId === "string" ? sub.projectId.trim() : "";
    const projectName = typeof sub.projectName === "string" ? sub.projectName.trim() : "";
    const planName = typeof sub.planName === "string" ? sub.planName.trim().toLowerCase() : "";

    if (!planName) return null;

    let project: { plans?: PlanLike[] } | null = null;

    if (projectId) {
        project = await Project.findById(projectId).select({ plans: 1 }).lean();
    }

    if (!project && projectName) {
        project = await Project.findOne({ name: projectName }).select({ plans: 1 }).lean();
    }

    if (!project?.plans?.length) return null;

    return project.plans.find((plan) =>
        typeof plan?.name === "string" && plan.name.trim().toLowerCase() === planName
    ) ?? null;
}

export async function resolveSubscriptionQuota(sub: SubscriptionLike): Promise<ResolvedSubscriptionQuota> {
    const usageCount = normalizeNonNegativeInt(sub.usageCount) ?? 0;
    const storedMaxUsage = normalizeNonNegativeInt(sub.maxUsage);

    let maxUsage = storedMaxUsage ?? 0;
    let shouldPersistResolvedMaxUsage = false;

    const linkedPlan = await findLinkedPlan(sub);
    const linkedPlanExplicitMaxUsage = normalizeNonNegativeInt(linkedPlan?.maxUsage);
    const linkedPlanInferredMaxUsage = inferUsageLimitFromDescriptions(linkedPlan?.descriptions);

    if (storedMaxUsage === null) {
        maxUsage = linkedPlanExplicitMaxUsage ?? linkedPlanInferredMaxUsage ?? 0;
        shouldPersistResolvedMaxUsage = maxUsage > 0;
    } else if (
        storedMaxUsage === 0 &&
        typeof linkedPlanInferredMaxUsage === "number" &&
        linkedPlanInferredMaxUsage > 0
    ) {
        // Legacy subscriptions often snapshotted `0` because older plan editors omitted maxUsage.
        // When the plan copy still says "1 resume" / "5 resumes", trust that intended quota.
        maxUsage = linkedPlanInferredMaxUsage;
        shouldPersistResolvedMaxUsage = true;
    }

    const hasUsage = maxUsage === 0 || usageCount < maxUsage;
    const remaining = maxUsage === 0 ? null : Math.max(0, maxUsage - usageCount);

    return {
        usageCount,
        maxUsage,
        hasUsage,
        remaining,
        shouldPersistResolvedMaxUsage,
    };
}
