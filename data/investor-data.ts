export type BlockStatus = "Active Exploration" | "Open Area" | "Production" | "Development"

export interface FiscalTerms {
    pscType: "Cost Recovery" | "Gross Split"
    royaltyRate: number // percentage
    taxRate: number // percentage
    costRecoveryCap?: number // percentage
    ftp?: number // First Tranche Petroleum percentage
    domesticMarketObligation: number // percentage
    signatureBonus?: number // USD Millions
    localContentObligation?: number // percentage
}

export interface Economics {
    npv10: number // USD Millions
    irr: number // percentage
    breakEvenPrice: number // USD/bbl
    priceScenarios: {
        price: number // USD/bbl
        npv: number // USD Millions
    }[]
}

export interface DevelopmentMilestone {
    year: number
    event: string
    status: "completed" | "planned" | "delayed"
}

export interface DevelopmentPlan {
    milestones: DevelopmentMilestone[]
    capex: number // USD Millions
    opex: number // USD Millions/year
    fidDate?: string
    firstOilDate?: string
}

export interface ContactInfo {
    agency: string
    role: string
    email: string
    phone: string
}

export interface Resources {
    oilReserves1P?: number // MMbbl
    oilReserves2P?: number // MMbbl
    gasReserves1P?: number // Bcf
    gasReserves2P?: number // Bcf
    contingentOil?: number // MMbbl
    contingentGas?: number // Bcf
    prospectiveOilMean?: number // MMbbl
    prospectiveGasMean?: number // Bcf
}

export interface ProductionProfile {
    year: number
    oilRate: number // bopd
    gasRate: number // mmscfd
}

export interface Infrastructure {
    nearestPipelineKm: number
    nearestRigKm: number
    waterDepth?: number // meters
    nearestPortKm: number
}

export interface RiskProfile {
    technical: number // 1-10 (10 is high risk)
    commercial: number
    political: number
    regulatory: number
}

export interface BlockCommercialData {
    id: string
    name: string
    operator: string
    partners: { name: string; equity: number }[]
    status: BlockStatus
    expiryDate: string
    acreageSqKm: number
    fiscalTerms: FiscalTerms
    economics?: Economics
    developmentPlan?: DevelopmentPlan
    contact?: ContactInfo
    resources: Resources
    production?: ProductionProfile[]
    infrastructure: Infrastructure
    risks: RiskProfile
    description: string
    recentActivity: string
}

export const MOCK_BLOCKS: Record<string, BlockCommercialData> = {
    "Mahakam Delta": {
        id: "blk-001",
        name: "Mahakam Delta",
        operator: "Pertamina Hulu Mahakam",
        partners: [
            { name: "Pertamina", equity: 100 }
        ],
        status: "Production",
        expiryDate: "2037-12-31",
        acreageSqKm: 2450,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 10,
            taxRate: 40,
            costRecoveryCap: 80,
            domesticMarketObligation: 25,
            signatureBonus: 5.0,
            localContentObligation: 35
        },
        economics: {
            npv10: 450,
            irr: 22,
            breakEvenPrice: 45,
            priceScenarios: [
                { price: 60, npv: 320 },
                { price: 75, npv: 450 },
                { price: 90, npv: 580 }
            ]
        },
        developmentPlan: {
            capex: 120,
            opex: 45,
            milestones: [
                { year: 2022, event: "Infill Drilling Phase 1", status: "completed" },
                { year: 2024, event: "Platform Upgrade", status: "planned" },
                { year: 2026, event: "Compression Install", status: "planned" }
            ]
        },
        contact: {
            agency: "SKK Migas",
            role: "Investment Division",
            email: "invest@skkmigas.go.id",
            phone: "+62 21 2924 1607"
        },
        resources: {
            oilReserves2P: 120,
            gasReserves2P: 3500,
            contingentGas: 1200
        },
        production: [
            { year: 2020, oilRate: 25000, gasRate: 450 },
            { year: 2021, oilRate: 22000, gasRate: 430 },
            { year: 2022, oilRate: 20000, gasRate: 410 },
            { year: 2023, oilRate: 18500, gasRate: 390 },
            { year: 2024, oilRate: 19000, gasRate: 400 }, // Post drilling bump
            { year: 2025, oilRate: 17500, gasRate: 380 },
            { year: 2026, oilRate: 16000, gasRate: 360 },
        ],
        infrastructure: {
            nearestPipelineKm: 0,
            nearestRigKm: 15,
            nearestPortKm: 25,
            waterDepth: 45
        },
        risks: {
            technical: 3,
            commercial: 2,
            political: 2,
            regulatory: 3
        },
        description: "Mature producing block with significant remaining gas potential in shallow zones.",
        recentActivity: "Drilling of 3 infill wells in Q3 2024."
    },
    "North Sumatra Offshore": {
        id: "blk-002",
        name: "North Sumatra Offshore",
        operator: "Harbour Energy",
        partners: [
            { name: "Harbour Energy", equity: 60 },
            { name: "Mubadala", equity: 40 }
        ],
        status: "Active Exploration",
        expiryDate: "2028-06-15",
        acreageSqKm: 4100,
        fiscalTerms: {
            pscType: "Gross Split",
            royaltyRate: 0, // Gross split implies variable split, simplifying here
            taxRate: 25,
            domesticMarketObligation: 25,
            signatureBonus: 15.0,
            localContentObligation: 40
        },
        economics: {
            npv10: 850,
            irr: 18,
            breakEvenPrice: 52,
            priceScenarios: [
                { price: 60, npv: 500 },
                { price: 75, npv: 850 },
                { price: 90, npv: 1200 }
            ]
        },
        developmentPlan: {
            capex: 1500,
            opex: 80,
            fidDate: "2026 Q4",
            firstOilDate: "2029 Q2",
            milestones: [
                { year: 2024, event: "Seismic Processing", status: "completed" },
                { year: 2025, event: "Exploration Well 1", status: "planned" },
                { year: 2026, event: "FID", status: "planned" }
            ]
        },
        contact: {
            agency: "SKK Migas",
            role: "Exploration Division",
            email: "exploration@skkmigas.go.id",
            phone: "+62 21 2924 1608"
        },
        resources: {
            prospectiveGasMean: 4500,
            prospectiveOilMean: 150
        },
        production: [
            { year: 2029, oilRate: 5000, gasRate: 150 },
            { year: 2030, oilRate: 12000, gasRate: 350 },
            { year: 2031, oilRate: 18000, gasRate: 550 },
            { year: 2032, oilRate: 15000, gasRate: 650 },
            { year: 2033, oilRate: 12000, gasRate: 600 },
            { year: 2034, oilRate: 9000, gasRate: 500 },
        ],
        infrastructure: {
            nearestPipelineKm: 120,
            nearestRigKm: 200,
            nearestPortKm: 150,
            waterDepth: 800
        },
        risks: {
            technical: 7,
            commercial: 5,
            political: 3,
            regulatory: 4
        },
        description: "High-impact deepwater gas play. Analogous to recent Andaman discoveries.",
        recentActivity: "3D Seismic acquisition completed. Processing underway."
    },
    "East Natuna": {
        id: "blk-003",
        name: "East Natuna",
        operator: "Pertamina",
        partners: [
            { name: "Pertamina", equity: 100 }
        ],
        status: "Open Area",
        expiryDate: "N/A",
        acreageSqKm: 12500,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 15,
            taxRate: 44,
            domesticMarketObligation: 25,
            signatureBonus: 0,
            localContentObligation: 30
        },
        contact: {
            agency: "ESDM",
            role: "Oil & Gas Directorate",
            email: "migas@esdm.go.id",
            phone: "+62 21 526 8910"
        },
        resources: {
            contingentGas: 46000, // High CO2
        },
        infrastructure: {
            nearestPipelineKm: 350,
            nearestRigKm: 400,
            nearestPortKm: 450,
            waterDepth: 120
        },
        risks: {
            technical: 9, // CO2 handling
            commercial: 8,
            political: 4,
            regulatory: 5
        },
        description: "Giant gas resource with high CO2 content. Requires CCS solution.",
        recentActivity: "Study on CCS hub potential ongoing."
    },
    "Tuna": {
        id: "blk-004",
        name: "Tuna",
        operator: "Harbour Energy",
        partners: [
            { name: "Harbour Energy", equity: 50 },
            { name: "Zarubezhneft", equity: 50 }
        ],
        status: "Development",
        expiryDate: "2035-03-12",
        acreageSqKm: 1800,
        fiscalTerms: {
            pscType: "Gross Split",
            royaltyRate: 0,
            taxRate: 25,
            domesticMarketObligation: 25,
            signatureBonus: 10.0,
            localContentObligation: 35
        },
        economics: {
            npv10: 650,
            irr: 16,
            breakEvenPrice: 55,
            priceScenarios: [
                { price: 60, npv: 200 },
                { price: 75, npv: 650 },
                { price: 90, npv: 900 }
            ]
        },
        developmentPlan: {
            capex: 950,
            opex: 65,
            fidDate: "2025 Q2",
            firstOilDate: "2027 Q4",
            milestones: [
                { year: 2023, event: "POD Approval", status: "completed" },
                { year: 2025, event: "FID", status: "planned" },
                { year: 2027, event: "First Gas", status: "planned" }
            ]
        },
        contact: {
            agency: "SKK Migas",
            role: "Development Division",
            email: "dev@skkmigas.go.id",
            phone: "+62 21 2924 1610"
        },
        resources: {
            contingentOil: 80,
            contingentGas: 1500
        },
        production: [
            { year: 2027, oilRate: 5000, gasRate: 20 },
            { year: 2028, oilRate: 15000, gasRate: 80 },
            { year: 2029, oilRate: 25000, gasRate: 120 },
            { year: 2030, oilRate: 22000, gasRate: 110 },
            { year: 2031, oilRate: 18000, gasRate: 100 },
            { year: 2032, oilRate: 14000, gasRate: 90 },
        ],
        infrastructure: {
            nearestPipelineKm: 250,
            nearestRigKm: 180,
            nearestPortKm: 300,
            waterDepth: 110
        },
        risks: {
            technical: 4,
            commercial: 6,
            political: 7, // Geopolitics
            regulatory: 3
        },
        description: "Strategic cross-border development near Vietnam maritime boundary.",
        recentActivity: "Farm-out process ongoing for partner interest."
    },
    "Masela": {
        id: "blk-005",
        name: "Masela",
        operator: "Inpex",
        partners: [
            { name: "Inpex", equity: 65 },
            { name: "Shell", equity: 35 }
        ],
        status: "Development",
        expiryDate: "2040-11-15",
        acreageSqKm: 3200,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 12,
            taxRate: 40,
            costRecoveryCap: 90,
            domesticMarketObligation: 25,
            signatureBonus: 25.0,
            localContentObligation: 45
        },
        economics: {
            npv10: 2100,
            irr: 14,
            breakEvenPrice: 48,
            priceScenarios: [
                { price: 60, npv: 1200 },
                { price: 75, npv: 2100 },
                { price: 90, npv: 3500 }
            ]
        },
        developmentPlan: {
            capex: 18500,
            opex: 450,
            fidDate: "2026 Q1",
            firstOilDate: "2030 Q3",
            milestones: [
                { year: 2019, event: "Original POD", status: "completed" },
                { year: 2023, event: "Revised POD (CCS)", status: "completed" },
                { year: 2026, event: "FID", status: "planned" }
            ]
        },
        contact: {
            agency: "SKK Migas",
            role: "Strategic Projects",
            email: "masela@skkmigas.go.id",
            phone: "+62 21 2924 1620"
        },
        resources: {
            gasReserves2P: 18500,
            contingentGas: 4000
        },
        production: [
            { year: 2030, oilRate: 0, gasRate: 400 },
            { year: 2031, oilRate: 0, gasRate: 950 }, // Ramp up
            { year: 2032, oilRate: 0, gasRate: 1200 }, // Plateau
            { year: 2033, oilRate: 0, gasRate: 1200 },
            { year: 2034, oilRate: 0, gasRate: 1200 },
            { year: 2035, oilRate: 0, gasRate: 1200 },
            { year: 2036, oilRate: 0, gasRate: 1150 },
        ],
        infrastructure: {
            nearestPipelineKm: 600,
            nearestRigKm: 500,
            nearestPortKm: 150,
            waterDepth: 600
        },
        risks: {
            technical: 6,
            commercial: 5,
            political: 3,
            regulatory: 4
        },
        description: "Abadi LNG project. One of the largest gas developments in the region including CCS.",
        recentActivity: "Revised Plan of Development approved including Carbon Capture."
    }
}
