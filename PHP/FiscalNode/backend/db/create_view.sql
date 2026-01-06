-- Create or replace the view_budget_burn_rates view
-- This view calculates budget statistics including parent_id for tree structure

CREATE OR REPLACE VIEW view_budget_burn_rates AS
WITH MonthlySpends AS (
    SELECT 
        budget_id, 
        SUM(amount) as total_spent 
    FROM transactions 
    WHERE DATE_FORMAT(transaction_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    GROUP BY budget_id
)
SELECT 
    b.id,
    b.parent_id,
    b.name,
    b.limit_amount,
    COALESCE(ms.total_spent, 0) as direct_spend,
    (COALESCE(ms.total_spent, 0) / NULLIF(b.limit_amount, 0)) * 100 as burn_rate_percentage,
    (b.limit_amount - COALESCE(ms.total_spent, 0)) as remaining_balance
FROM budgets b
LEFT JOIN MonthlySpends ms ON b.id = ms.budget_id;

