BEGIN;

-- Guardrail before enforcing uniqueness.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.finance_cases
    WHERE operations_quote_id IS NOT NULL
    GROUP BY operations_quote_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce unique finance case per quote: duplicate finance_cases.operations_quote_id values exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.finance_orders
    WHERE operations_quote_id IS NOT NULL
    GROUP BY operations_quote_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce unique finance order per quote: duplicate finance_orders.operations_quote_id values exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.finance_invoices
    WHERE finance_order_id IS NOT NULL
    GROUP BY finance_order_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce unique finance invoice per order: duplicate finance_invoices.finance_order_id values exist';
  END IF;
END;
$$;

-- Canonical quote->case/order and order->invoice path.
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_cases_quote_unique
ON public.finance_cases (operations_quote_id)
WHERE operations_quote_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_orders_quote_unique
ON public.finance_orders (operations_quote_id)
WHERE operations_quote_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_invoices_order_unique
ON public.finance_invoices (finance_order_id)
WHERE finance_order_id IS NOT NULL;

COMMIT;
