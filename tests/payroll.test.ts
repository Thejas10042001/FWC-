import { describe, it, expect } from "vitest";
import { calculatePayroll } from "../src/utils/payrollCalculator";

describe("Enterprise HRMS Payroll Processing Calculations", () => {
  
  it("computes accurately for a super-high salary tier (e.g. $25,000) that exceeds the ESI cap and falls into the highest tax bracket (> $12,000)", () => {
    const salary = 25000;
    const result = calculatePayroll(salary);
    
    // PF = 12% of 25,000 = 3,000
    expect(result.pfDeduction).toBe(3000);
    
    // ESI = 0 because 25,000 > 21,000 threshold
    expect(result.esiDeduction).toBe(0);
    
    // Allowances = 15% of 25,000 = 3,750
    expect(result.allowances).toBe(3750);
    
    // Tax = 20% of 25,000 = 5,000 (since > 12,000)
    expect(result.taxDeduction).toBe(5000);
    
    // Net Salary = 25000 (salary) + 3750 (allowance) - 3000 (pf) - 0 (esi) - 5000 (tax) = 20750
    expect(result.netSalary).toBe(20750);
  });

  it("computes accurately for a standard salary tier (e.g. $15,000) which has ESI deductions and falls in the highest tax bracket (> $12,000)", () => {
    const salary = 15000;
    const result = calculatePayroll(salary);
    
    // PF = 12% of 15,000 = 1,800
    expect(result.pfDeduction).toBe(1800);
    
    // ESI = 0.75% of 15,000 = 112.5 -> rounds to 113
    expect(result.esiDeduction).toBe(113);
    
    // Allowances = 15% of 15,000 = 2,250
    expect(result.allowances).toBe(2250);
    
    // Tax = 20% of 15,000 = 3,000
    expect(result.taxDeduction).toBe(3000);
    
    // Net Salary = 15000 + 2250 - 1800 - 113 - 3000 = 12337
    expect(result.netSalary).toBe(12337);
  });

  it("computes accurately for a senior executive salary tier (e.g. $10,000) which has ESI and fall in the 15% tax bracket (between $8,000 and $12,000)", () => {
    const salary = 10000;
    const result = calculatePayroll(salary);
    
    // PF = 12% of 10,000 = 1,200
    expect(result.pfDeduction).toBe(1200);
    
    // ESI = 0.75% of 10,000 = 75
    expect(result.esiDeduction).toBe(75);
    
    // Allowances = 15% of 10,000 = 1,500
    expect(result.allowances).toBe(1500);
    
    // Tax = 15% of 10,000 = 1,500
    expect(result.taxDeduction).toBe(1500);
    
    // Net Salary = 10000 + 1500 - 1200 - 75 - 1500 = 8725
    expect(result.netSalary).toBe(8725);
  });

  it("computes accurately for a mid-level manager tier (e.g. $6,000) with ESI and falls in the 10% tax bracket (between $5,000 and $8,000)", () => {
    const salary = 6000;
    const result = calculatePayroll(salary);
    
    // PF = 12% of 6,000 = 720
    expect(result.pfDeduction).toBe(720);
    
    // ESI = 0.75% of 6,000 = 45
    expect(result.esiDeduction).toBe(45);
    
    // Allowances = 15% of 6,000 = 900
    expect(result.allowances).toBe(900);
    
    // Tax = 10% of 6,000 = 600
    expect(result.taxDeduction).toBe(600);
    
    // Net Salary = 6000 + 900 - 720 - 45 - 600 = 5535
    expect(result.netSalary).toBe(5535);
  });

  it("computes accurately for a low / entry-level salary bracket ($4,000) where taxes/TDS are completely exempt (<= $5,000)", () => {
    const salary = 4000;
    const result = calculatePayroll(salary);
    
    // PF = 12% of 4000 = 480
    expect(result.pfDeduction).toBe(480);
    
    // ESI = 0.75% of 4000 = 30
    expect(result.esiDeduction).toBe(30);
    
    // Allowances = 15% of 4000 = 600
    expect(result.allowances).toBe(600);
    
    // Tax = 0 (since <= 5,000)
    expect(result.taxDeduction).toBe(0);
    
    // Net Salary = 4000 + 600 - 480 - 30 - 0 = 4090
    expect(result.netSalary).toBe(4090);
  });

  it("validates boundary values like exact thresholds", () => {
    // Test exact tax threshold boundary of $5,000 (should not charge tax since bracket check is > 5000)
    const p5000 = calculatePayroll(5000);
    expect(p5000.taxDeduction).toBe(0);

    // Test tax boundary of $5,001 (should charge 10% tax since > 5000)
    const p5001 = calculatePayroll(5001);
    expect(p5001.taxDeduction).toBe(Math.round(5001 * 0.10)); // 500

    // Test exact tax threshold boundary of $8,000 (should charge 10% since not > 8000)
    const p8000 = calculatePayroll(8000);
    expect(p8000.taxDeduction).toBe(Math.round(8000 * 0.10)); // 800

    // Test tax boundary of $8,001 (should charge 15% since > 8000)
    const p8001 = calculatePayroll(8001);
    expect(p8001.taxDeduction).toBe(Math.round(8001 * 0.15)); // 1200
  });
});
