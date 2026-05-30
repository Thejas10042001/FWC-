/**
 * Core Payroll Calculations Utility
 * 
 * Computes standard allowances and statutory deductions (PF, ESI, Tax/TDS)
 * based on base salary brackets for enterprise employees.
 */

export interface PayrollDetails {
  allowances: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  netSalary: number;
}

export function calculatePayroll(baseSalary: number): PayrollDetails {
  const allowances = Math.round(baseSalary * 0.15); // Medical & HRA (15%)
  const pfDeduction = Math.round(baseSalary * 0.12); // Standard 12% Providend Fund (PF)
  
  // ESI deduction is 0.75% if base salary <= 21,000 threshold, otherwise 0
  const esiDeduction = baseSalary > 21000 ? 0 : Math.round(baseSalary * 0.0075);
  
  // TDS tax deduction based on salary brackets:
  // - > 12,000 : 20% tax rate
  // - > 8,000 up to 12,000 : 15% tax rate
  // - > 5,000 up to 8,000 : 10% tax rate
  // - <= 5,000 : 0% tax rate
  let taxDeduction = 0;
  if (baseSalary > 12000) {
    taxDeduction = Math.round(baseSalary * 0.20);
  } else if (baseSalary > 8000) {
    taxDeduction = Math.round(baseSalary * 0.15);
  } else if (baseSalary > 5000) {
    taxDeduction = Math.round(baseSalary * 0.10);
  }
  
  // Net salary calculation
  const netSalary = baseSalary + allowances - pfDeduction - esiDeduction - taxDeduction;
  
  return {
    allowances,
    pfDeduction,
    esiDeduction,
    taxDeduction,
    netSalary,
  };
}
