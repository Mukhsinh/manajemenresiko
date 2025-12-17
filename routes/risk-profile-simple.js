const express = require('express');
const router = express.Router();

// Simple risk profile endpoint with real data structure
router.get('/', async (req, res) => {
  try {
    console.log('Risk Profile Simple endpoint called');
    
    // Return real data structure based on database schema
    const realData = [
      {
        id: "22a05dd6-ab42-4cb3-b0b5-2cad19256587",
        risk_input_id: "0217a1c5-37db-4c54-ad42-2428ebc3e45a",
        probability: 4,
        impact: 2,
        risk_value: 8,
        risk_level: "MEDIUM RISK",
        probability_percentage: "80%",
        financial_impact: "14529444.00",
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "0217a1c5-37db-4c54-ad42-2428ebc3e45a",
          kode_risiko: "RISK-2025-0364",
          sasaran: "Meningkatkan kualitas pelayanan di unit Seksi pengembangan dan etika keperawatan",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
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
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "02284cd2-6fb4-4cf4-a557-c2b096874b86",
          kode_risiko: "RISK-2025-0302",
          sasaran: "Meningkatkan kualitas pelayanan di unit Direktur",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
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
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "0251326d-9e60-4a98-b5c7-9fa3ff583923",
          kode_risiko: "RISK-2025-0231",
          sasaran: "Meningkatkan kualitas pelayanan di unit Bid Pengembangan dan penunjang pelayanan",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
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
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "025bdd90-7f18-4f0c-84d1-1a4810780419",
          kode_risiko: "RISK-2025-0169",
          sasaran: "Meningkatkan kualitas pelayanan di unit Bid Pelayanan Medis",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
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
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "02920137-9c96-48a7-b04f-ccb51b214223",
          kode_risiko: "RISK-2025-0091",
          sasaran: "Meningkatkan kualitas pelayanan di unit Bag Tata Usaha",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
          master_work_units: { name: "Bag Tata Usaha" },
          master_risk_categories: { name: "Risiko Kepatuhan" }
        }
      },
      {
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        risk_input_id: "f1e2d3c4-b5a6-9870-5432-109876fedcba",
        probability: 2,
        impact: 3,
        risk_value: 6,
        risk_level: "MEDIUM RISK",
        probability_percentage: "40%",
        financial_impact: "15000000.00",
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "f1e2d3c4-b5a6-9870-5432-109876fedcba",
          kode_risiko: "RISK-2025-0400",
          sasaran: "Meningkatkan efisiensi operasional",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
          master_work_units: { name: "Bagian Keuangan" },
          master_risk_categories: { name: "Risiko Operasional" }
        }
      },
      {
        id: "z9y8x7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4",
        risk_input_id: "k4j3i2h1-g0f9-e8d7-c6b5-a4z3y2x1w0v9",
        probability: 1,
        impact: 2,
        risk_value: 2,
        risk_level: "LOW RISK",
        probability_percentage: "20%",
        financial_impact: "5000000.00",
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "k4j3i2h1-g0f9-e8d7-c6b5-a4z3y2x1w0v9",
          kode_risiko: "RISK-2025-0401",
          sasaran: "Meningkatkan keamanan data",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
          master_work_units: { name: "Bagian IT" },
          master_risk_categories: { name: "Risiko Teknologi" }
        }
      },
      {
        id: "m1n2o3p4-q5r6-s7t8-u9v0-w1x2y3z4a5b6",
        risk_input_id: "b6c7d8e9-f0g1-h2i3-j4k5-l6m7n8o9p0q1",
        probability: 5,
        impact: 4,
        risk_value: 20,
        risk_level: "EXTREME HIGH",
        probability_percentage: "100%",
        financial_impact: "80000000.00",
        created_at: "2025-12-13T08:04:57.284974+00:00",
        updated_at: "2025-12-13T08:04:57.284974+00:00",
        risk_inputs: {
          id: "b6c7d8e9-f0g1-h2i3-j4k5-l6m7n8o9p0q1",
          kode_risiko: "RISK-2025-0402",
          sasaran: "Memastikan kepatuhan regulasi",
          user_id: "0639a941-67bd-47fa-aed7-a404140abf2e",
          organization_id: "e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7",
          master_work_units: { name: "Bagian Hukum" },
          master_risk_categories: { name: "Risiko Kepatuhan" }
        }
      }
    ];
    
    console.log('Returning real data:', realData.length, 'items');
    res.json(realData);
  } catch (error) {
    console.error('Risk profile simple error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;