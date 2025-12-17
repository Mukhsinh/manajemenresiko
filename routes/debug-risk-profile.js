const express = require('express');
const router = express.Router();

// DEBUG: Simple test endpoint for risk profile
router.get('/', async (req, res) => {
  try {
    console.log('DEBUG: Risk Profile endpoint called');
    
    // Return hardcoded data for now to test frontend
    const sampleData = [
      {
        id: "22a05dd6-ab42-4cb3-b0b5-2cad19256587",
        risk_input_id: "0217a1c5-37db-4c54-ad42-2428ebc3e45a",
        probability: 4,
        impact: 2,
        risk_value: 8,
        risk_level: "MEDIUM RISK",
        probability_percentage: "80%",
        financial_impact: "14529444.00",
        risk_inputs: {
          id: "0217a1c5-37db-4c54-ad42-2428ebc3e45a",
          kode_risiko: "RISK-2025-0364",
          sasaran: "Meningkatkan kualitas pelayanan",
          master_work_units: { name: "Seksi pengembangan dan etika keperawatan" },
          master_risk_categories: { name: "Risiko Operasional" }
        }
      },
      {
        id: "d7ca9668-cb6d-410d-83cc-77e23a9a3185",
        risk_input_id: "02284cd2-6fb4-4cf4-a557-c2b096874b86",
        probability: 5,
        impact: 5,
        risk_value: 25,
        risk_level: "EXTREME HIGH",
        probability_percentage: "100%",
        financial_impact: "64281995.00",
        risk_inputs: {
          id: "02284cd2-6fb4-4cf4-a557-c2b096874b86",
          kode_risiko: "RISK-2025-0302",
          sasaran: "Meningkatkan kualitas pelayanan",
          master_work_units: { name: "Direktur" },
          master_risk_categories: { name: "Risiko Fraud" }
        }
      },
      {
        id: "849d735e-3cf4-4856-84e8-ca51136d7ced",
        risk_input_id: "0251326d-9e60-4a98-b5c7-9fa3ff583923",
        probability: 4,
        impact: 2,
        risk_value: 8,
        risk_level: "MEDIUM RISK",
        probability_percentage: "80%",
        financial_impact: "53392172.00",
        risk_inputs: {
          id: "0251326d-9e60-4a98-b5c7-9fa3ff583923",
          kode_risiko: "RISK-2025-0231",
          sasaran: "Meningkatkan kualitas pelayanan",
          master_work_units: { name: "Bid Pengembangan dan penunjang pelayanan" },
          master_risk_categories: { name: "Risiko Fraud" }
        }
      },
      {
        id: "6dc40754-3893-45f4-a12f-f8ad83a116f0",
        risk_input_id: "025bdd90-7f18-4f0c-84d1-1a4810780419",
        probability: 3,
        impact: 5,
        risk_value: 15,
        risk_level: "HIGH RISK",
        probability_percentage: "60%",
        financial_impact: "25196097.00",
        risk_inputs: {
          id: "025bdd90-7f18-4f0c-84d1-1a4810780419",
          kode_risiko: "RISK-2025-0169",
          sasaran: "Meningkatkan kualitas pelayanan",
          master_work_units: { name: "Bid Pelayanan Medis" },
          master_risk_categories: { name: "Risiko Legal" }
        }
      },
      {
        id: "bf43c688-6662-4066-afc3-e1ed8e640015",
        risk_input_id: "02920137-9c96-48a7-b04f-ccb51b214223",
        probability: 4,
        impact: 2,
        risk_value: 8,
        risk_level: "MEDIUM RISK",
        probability_percentage: "80%",
        financial_impact: "29431528.00",
        risk_inputs: {
          id: "02920137-9c96-48a7-b04f-ccb51b214223",
          kode_risiko: "RISK-2025-0091",
          sasaran: "Meningkatkan kualitas pelayanan",
          master_work_units: { name: "Bag Tata Usaha" },
          master_risk_categories: { name: "Risiko Kepatuhan" }
        }
      }
    ];
    
    console.log('DEBUG: Returning sample data:', sampleData.length, 'items');
    res.json(sampleData);
  } catch (error) {
    console.error('DEBUG: Risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;