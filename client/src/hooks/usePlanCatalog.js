import { useQuery } from '@tanstack/react-query'
import { pricing } from '../content/landing/index.js'
import { getPlans } from '../services/studyAdapter.js'
import { queryKeys } from '../services/queryKeys.js'

function mergePlanCatalog(serverPlans) {
  if (!serverPlans?.length) return pricing
  const plus = serverPlans.find((plan) => plan.key === 'plus')
  return {
    ...pricing,
    note: plus ? `PBX Nursing Plus costs ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: plus.currency, maximumFractionDigits: 0 }).format(plus.amount / 100)} for ${plus.durationDays} days of digital educational access.` : pricing.note,
    plans: pricing.plans.map((plan) => {
      const serverPlan = serverPlans.find((candidate) => candidate.key === plan.key)
      if (!serverPlan) return plan
      const features = serverPlan.key === 'free' ? [
        'Create unlimited tests',
        `Access ${serverPlan.limits.questions} questions`,
        `Save up to ${serverPlan.limits.notes} notes`,
        `Save up to ${serverPlan.limits.highlights} highlights`,
      ] : plan.features
      return {
        ...plan,
        price: serverPlan.amount === 0 ? '₹0' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: serverPlan.currency, maximumFractionDigits: 0 }).format(serverPlan.amount / 100),
        cadence: serverPlan.durationDays ? `${serverPlan.durationDays} days of access` : plan.cadence,
        limits: serverPlan.limits,
        features,
      }
    }),
  }
}

export function usePlanCatalog() {
  const plansQuery = useQuery({
    queryKey: queryKeys.plans,
    queryFn: getPlans,
    staleTime: 5 * 60_000,
  })
  return plansQuery.data ? mergePlanCatalog(plansQuery.data.plans) : pricing
}
