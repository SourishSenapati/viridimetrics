from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class FinancialAnalyzerRequest(BaseModel):
    # Inputs
    installation_cost_usd_per_m2: float = Field(..., gt=0.0)
    annual_maintenance_usd_per_m2: float = Field(..., ge=0.0)
    wall_area_m2: float = Field(..., gt=0.0)
    daily_electricity_savings_kwh: float = Field(..., gt=0.0)
    electricity_rate_usd_kwh: float = Field(..., gt=0.0)
    discount_rate_percent: float = Field(8.0, ge=0.0, le=100.0)
    project_lifetime_years: int = Field(15, ge=1, le=50)

class FinancialAnalyzerResponse(BaseModel):
    initial_capital_expense_usd: float
    annual_operating_expense_usd: float
    annual_utility_savings_usd: float
    net_annual_cash_flow_usd: float
    simple_payback_years: float
    net_present_value_usd: float
    internal_rate_of_return_percent: Optional[float]

class FinancialYieldCalculator:
    """
    Performs institutional commercial real estate financial analyses (NPV, IRR, Payback)
    for green wall utility capital deployments.
    """
    
    @staticmethod
    def calculate_npv(initial_cost: float, net_cash_flow: float, rate: float, years: int) -> float:
        """
        Calculates Net Present Value (NPV).
        """
        npv = -initial_cost
        for t in range(1, years + 1):
            npv += net_cash_flow / ((1.0 + rate) ** t)
        return npv

    @classmethod
    def calculate_irr(cls, initial_cost: float, net_cash_flow: float, years: int) -> Optional[float]:
        """
        Calculates Internal Rate of Return (IRR) using the secant root-finding method.
        Solves for r where NPV(r) = 0.
        """
        if net_cash_flow <= 0:
            return None  # IRR is not defined for negative/zero net cash flows
            
        # Helper function for NPV evaluation
        def npv_func(r: float) -> float:
            return cls.calculate_npv(initial_cost, net_cash_flow, r, years)

        # Secant method iterations
        r0 = 0.05  # Guess 1: 5%
        r1 = 0.15  # Guess 2: 15%
        
        f0 = npv_func(r0)
        f1 = npv_func(r1)
        
        max_iter = 100
        tolerance = 1e-5
        
        for _ in range(max_iter):
            if abs(f1 - f0) < 1e-12:
                break
                
            r_next = r1 - f1 * (r1 - r0) / (f1 - f0)
            
            # Bound rate to avoid divergent guesses
            if r_next < -0.99 or r_next > 5.0:
                return None
                
            f_next = npv_func(r_next)
            
            if abs(f_next) < tolerance:
                return r_next * 100.0  # Return as percentage
                
            r0, r1 = r1, r_next
            f0, f1 = f1, f_next
            
        return r1 * 100.0 if abs(npv_func(r1)) < 1.0 else None

    @classmethod
    def analyze_yield(cls, req: FinancialAnalyzerRequest) -> FinancialAnalyzerResponse:
        # CapEx & OpEx totals
        initial_capex = req.installation_cost_usd_per_m2 * req.wall_area_m2
        annual_opex = req.annual_maintenance_usd_per_m2 * req.wall_area_m2
        
        # Savings
        # 365 days of cooling reduction (assuming year-round thermal calculations scaling,
        # or typical hot days, but for simple MVP formulas we extrapolate daily calculations annually)
        annual_savings = req.daily_electricity_savings_kwh * 365.0 * req.electricity_rate_usd_kwh
        net_cash_flow = annual_savings - annual_opex
        
        # Simple Payback Period (years)
        payback = initial_capex / net_cash_flow if net_cash_flow > 0 else float('inf')
        
        # Discount rate as decimal
        r_dec = req.discount_rate_percent / 100.0
        
        # NPV
        npv = cls.calculate_npv(initial_capex, net_cash_flow, r_dec, req.project_lifetime_years)
        
        # IRR
        irr = cls.calculate_irr(initial_capex, net_cash_flow, req.project_lifetime_years)
        
        return FinancialAnalyzerResponse(
            initial_capital_expense_usd=round(initial_capex, 2),
            annual_operating_expense_usd=round(annual_opex, 2),
            annual_utility_savings_usd=round(annual_savings, 2),
            net_annual_cash_flow_usd=round(net_cash_flow, 2),
            simple_payback_years=round(payback, 2) if payback != float('inf') else 999.0,
            net_present_value_usd=round(npv, 2),
            internal_rate_of_return_percent=round(irr, 2) if irr is not None else None
        )
ZO_MOCK_YIELD_INPUTS = {
    "installation_cost_usd_per_m2": 450.00,
    "annual_maintenance_usd_per_m2": 25.00,
    "wall_area_m2": 150.0,
    "daily_electricity_savings_kwh": 45.0,
    "electricity_rate_usd_kwh": 0.15
}
