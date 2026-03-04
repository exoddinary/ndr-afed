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
    "Q1": {
        id: "blk-001",
        name: "Q1",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [
            { name: "Shell", equity: 50 },
            { name: "ExxonMobil", equity: 50 }
        ],
        status: "Production",
        expiryDate: "2035-12-31",
        acreageSqKm: 580,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 0,
            taxRate: 50,
            costRecoveryCap: 100,
            domesticMarketObligation: 0,
            signatureBonus: 0,
            localContentObligation: 0
        },
        economics: {
            npv10: 620,
            irr: 24,
            breakEvenPrice: 38,
            priceScenarios: [
                { price: 60, npv: 420 },
                { price: 75, npv: 620 },
                { price: 90, npv: 820 }
            ]
        },
        developmentPlan: {
            capex: 85,
            opex: 40,
            milestones: [
                { year: 2022, event: "Infill Drilling Phase 1", status: "completed" },
                { year: 2024, event: "Platform Compression Upgrade", status: "completed" },
                { year: 2026, event: "Satellite Tie-back", status: "planned" }
            ]
        },
        contact: {
            agency: "National Data Room",
            role: "Investment Division",
            email: "invest@ndr.nl",
            phone: "+31 70 379 8911"
        },
        resources: {
            oilReserves2P: 85,
            gasReserves2P: 2100,
            contingentGas: 450
        },
        production: [
            { year: 2020, oilRate: 12000, gasRate: 210 },
            { year: 2021, oilRate: 11200, gasRate: 195 },
            { year: 2022, oilRate: 10500, gasRate: 185 },
            { year: 2023, oilRate: 9800, gasRate: 175 },
            { year: 2024, oilRate: 10200, gasRate: 180 },
            { year: 2025, oilRate: 9400, gasRate: 168 },
            { year: 2026, oilRate: 8700, gasRate: 155 },
        ],
        infrastructure: {
            nearestPipelineKm: 0,
            nearestRigKm: 12,
            nearestPortKm: 18,
            waterDepth: 32
        },
        risks: {
            technical: 3,
            commercial: 2,
            political: 1,
            regulatory: 2
        },
        description: "Mature producing block in the Southern North Sea. Significant remaining gas potential in Rotliegend sandstone reservoirs.",
        recentActivity: "Compression upgrade completed Q2 2024; satellite tie-back study underway."
    },
    "L2": {
        id: "blk-002",
        name: "L2",
        operator: "ONE-Dyas",
        partners: [
            { name: "ONE-Dyas", equity: 70 },
            { name: "Taqa Energy", equity: 30 }
        ],
        status: "Active Exploration",
        expiryDate: "2028-06-30",
        acreageSqKm: 490,
        fiscalTerms: {
            pscType: "Gross Split",
            royaltyRate: 0,
            taxRate: 50,
            domesticMarketObligation: 0,
            signatureBonus: 8.0,
            localContentObligation: 0
        },
        economics: {
            npv10: 480,
            irr: 17,
            breakEvenPrice: 50,
            priceScenarios: [
                { price: 60, npv: 280 },
                { price: 75, npv: 480 },
                { price: 90, npv: 720 }
            ]
        },
        developmentPlan: {
            capex: 680,
            opex: 55,
            fidDate: "2026 Q3",
            firstOilDate: "2029 Q1",
            milestones: [
                { year: 2024, event: "3D Seismic Reprocessing", status: "completed" },
                { year: 2025, event: "Exploration Well L2-Alpha", status: "planned" },
                { year: 2026, event: "FID", status: "planned" }
            ]
        },
        contact: {
            agency: "National Data Room",
            role: "Exploration Division",
            email: "exploration@ndr.nl",
            phone: "+31 70 379 8912"
        },
        resources: {
            prospectiveGasMean: 3200,
            prospectiveOilMean: 65
        },
        production: [
            { year: 2029, oilRate: 4000, gasRate: 80 },
            { year: 2030, oilRate: 9000, gasRate: 185 },
            { year: 2031, oilRate: 13000, gasRate: 260 },
            { year: 2032, oilRate: 11000, gasRate: 225 },
            { year: 2033, oilRate: 8500, gasRate: 190 },
            { year: 2034, oilRate: 6000, gasRate: 150 },
        ],
        infrastructure: {
            nearestPipelineKm: 35,
            nearestRigKm: 90,
            nearestPortKm: 65,
            waterDepth: 45
        },
        risks: {
            technical: 5,
            commercial: 4,
            political: 1,
            regulatory: 3
        },
        description: "Emerging exploration block north of Den Helder. Analogous to productive K and L block discoveries.",
        recentActivity: "Seismic reprocessing complete. First exploration well planned for 2025."
    },
    "K5": {
        id: "blk-003",
        name: "K5",
        operator: "Equinor Netherlands",
        partners: [
            { name: "Equinor", equity: 45 },
            { name: "Wintershall Dea", equity: 35 },
            { name: "Energie Beheer Nederland", equity: 20 }
        ],
        status: "Production",
        expiryDate: "2038-03-15",
        acreageSqKm: 610,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 0,
            taxRate: 50,
            costRecoveryCap: 100,
            domesticMarketObligation: 0,
            signatureBonus: 0,
            localContentObligation: 0
        },
        contact: {
            agency: "National Data Room",
            role: "Operations Division",
            email: "ops@ndr.nl",
            phone: "+31 70 379 8913"
        },
        resources: {
            gasReserves2P: 5800,
            contingentGas: 1100
        },
        infrastructure: {
            nearestPipelineKm: 0,
            nearestRigKm: 22,
            nearestPortKm: 40,
            waterDepth: 38
        },
        risks: {
            technical: 4,
            commercial: 3,
            political: 1,
            regulatory: 2
        },
        description: "Substantial gas producer in the central North Sea. Rotliegend and Carboniferous reservoirs with remaining upside.",
        recentActivity: "Subsea inspection programme completed. CCS storage assessment ongoing."
    },
    "F3": {
        id: "blk-004",
        name: "F3",
        operator: "Wintershall Dea",
        partners: [
            { name: "Wintershall Dea", equity: 60 },
            { name: "EBN", equity: 40 }
        ],
        status: "Development",
        expiryDate: "2036-09-01",
        acreageSqKm: 540,
        fiscalTerms: {
            pscType: "Gross Split",
            royaltyRate: 0,
            taxRate: 50,
            domesticMarketObligation: 0,
            signatureBonus: 12.0,
            localContentObligation: 0
        },
        economics: {
            npv10: 890,
            irr: 19,
            breakEvenPrice: 44,
            priceScenarios: [
                { price: 60, npv: 480 },
                { price: 75, npv: 890 },
                { price: 90, npv: 1380 }
            ]
        },
        developmentPlan: {
            capex: 1200,
            opex: 90,
            fidDate: "2025 Q4",
            firstOilDate: "2028 Q2",
            milestones: [
                { year: 2023, event: "Concept Select (FEED)", status: "completed" },
                { year: 2025, event: "FID", status: "planned" },
                { year: 2028, event: "First Gas", status: "planned" }
            ]
        },
        contact: {
            agency: "National Data Room",
            role: "Development Division",
            email: "dev@ndr.nl",
            phone: "+31 70 379 8914"
        },
        resources: {
            contingentGas: 2100,
            contingentOil: 45
        },
        production: [
            { year: 2028, oilRate: 2000, gasRate: 55 },
            { year: 2029, oilRate: 7500, gasRate: 145 },
            { year: 2030, oilRate: 11000, gasRate: 210 },
            { year: 2031, oilRate: 9500, gasRate: 190 },
            { year: 2032, oilRate: 7500, gasRate: 165 },
            { year: 2033, oilRate: 5500, gasRate: 130 },
        ],
        infrastructure: {
            nearestPipelineKm: 18,
            nearestRigKm: 55,
            nearestPortKm: 72,
            waterDepth: 42
        },
        risks: {
            technical: 4,
            commercial: 4,
            political: 1,
            regulatory: 3
        },
        description: "Significant tie-back development in the Dutch Central Graben. Gas and light oil discovery.",
        recentActivity: "FEED completed. FID expected Q4 2025 pending gas offtake agreement."
    },
    "E18": {
        id: "blk-005",
        name: "E18",
        operator: "Energean Netherlands",
        partners: [
            { name: "Energean", equity: 80 },
            { name: "EBN", equity: 20 }
        ],
        status: "Active Exploration",
        expiryDate: "2029-05-22",
        acreageSqKm: 360,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 0,
            taxRate: 50,
            costRecoveryCap: 100,
            domesticMarketObligation: 0,
            signatureBonus: 4.0,
            localContentObligation: 0
        },
        economics: {
            npv10: 195,
            irr: 14,
            breakEvenPrice: 56,
            priceScenarios: [
                { price: 60, npv: 60 },
                { price: 75, npv: 195 },
                { price: 90, npv: 340 }
            ]
        },
        developmentPlan: {
            capex: 280,
            opex: 22,
            fidDate: "2027 Q1",
            firstOilDate: "2029 Q3",
            milestones: [
                { year: 2025, event: "Exploration Well E18-Alpha", status: "planned" },
                { year: 2027, event: "FID", status: "planned" }
            ]
        },
        contact: {
            agency: "National Data Room",
            role: "Exploration Division",
            email: "exploration@ndr.nl",
            phone: "+31 70 379 8912"
        },
        resources: {
            contingentGas: 420,
            prospectiveGasMean: 680
        },
        production: [
            { year: 2029, oilRate: 0, gasRate: 22 },
            { year: 2030, oilRate: 0, gasRate: 45 },
            { year: 2031, oilRate: 0, gasRate: 40 },
            { year: 2032, oilRate: 0, gasRate: 32 },
        ],
        infrastructure: {
            nearestPipelineKm: 28,
            nearestRigKm: 75,
            nearestPortKm: 58,
            waterDepth: 35
        },
        risks: {
            technical: 5,
            commercial: 4,
            political: 1,
            regulatory: 2
        },
        description: "Shallow gas prospect in the southern North Sea. Excellent access to onshore grid via existing pipeline.",
        recentActivity: "Environmental permit application submitted. Well location finalised."
    },
    "P15": {
        id: "blk-006",
        name: "P15",
        operator: "Vår Energi Netherlands",
        partners: [
            { name: "Vår Energi", equity: 55 },
            { name: "Spirit Energy", equity: 25 },
            { name: "EBN", equity: 20 }
        ],
        status: "Production",
        expiryDate: "2040-01-01",
        acreageSqKm: 525,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 0,
            taxRate: 50,
            costRecoveryCap: 100,
            domesticMarketObligation: 0,
            signatureBonus: 0,
            localContentObligation: 0
        },
        economics: {
            npv10: 1540,
            irr: 26,
            breakEvenPrice: 33,
            priceScenarios: [
                { price: 60, npv: 1100 },
                { price: 75, npv: 1540 },
                { price: 90, npv: 1980 }
            ]
        },
        developmentPlan: {
            capex: 1800,
            opex: 520,
            milestones: [
                { year: 2023, event: "Infill Drilling Campaign", status: "completed" },
                { year: 2025, event: "Subsea Intervention", status: "planned" }
            ]
        },
        contact: {
            agency: "National Data Room",
            role: "Operations Division",
            email: "ops@ndr.nl",
            phone: "+31 70 379 8915"
        },
        resources: {
            oilReserves2P: 310,
            gasReserves2P: 1200,
            contingentOil: 120
        },
        production: [
            { year: 2024, oilRate: 62000, gasRate: 85 },
            { year: 2025, oilRate: 58000, gasRate: 80 },
            { year: 2026, oilRate: 54000, gasRate: 74 },
            { year: 2027, oilRate: 50000, gasRate: 68 },
        ],
        infrastructure: {
            nearestPipelineKm: 0,
            nearestRigKm: 8,
            nearestPortKm: 30,
            waterDepth: 29
        },
        risks: {
            technical: 2,
            commercial: 1,
            political: 1,
            regulatory: 2
        },
        description: "Netherlands' largest oil producing block. Mature field with ongoing infill drilling and EOR potential.",
        recentActivity: "Infill drilling maintaining production plateau. EOR CO2 injection study complete."
    },
    "G17a": {
        id: "blk-007",
        name: "G17a",
        operator: "TotalEnergies EP Nederland",
        partners: [
            { name: "TotalEnergies", equity: 50 },
            { name: "NAM", equity: 30 },
            { name: "EBN", equity: 20 }
        ],
        status: "Production",
        expiryDate: "2039-06-30",
        acreageSqKm: 415,
        fiscalTerms: {
            pscType: "Gross Split",
            royaltyRate: 0,
            taxRate: 50,
            domesticMarketObligation: 0,
            signatureBonus: 0,
            localContentObligation: 0
        },
        economics: {
            npv10: 760,
            irr: 21,
            breakEvenPrice: 40,
            priceScenarios: [
                { price: 60, npv: 550 },
                { price: 75, npv: 760 },
                { price: 90, npv: 970 }
            ]
        },
        developmentPlan: {
            capex: 320,
            opex: 115,
            milestones: [
                { year: 2023, event: "Compression Tie-in", status: "completed" },
                { year: 2025, event: "New Gas Sales Agreement", status: "planned" }
            ]
        },
        contact: {
            agency: "National Data Room",
            role: "Gas Division",
            email: "gas@ndr.nl",
            phone: "+31 70 379 8916"
        },
        resources: {
            gasReserves2P: 980,
            contingentGas: 250
        },
        production: [
            { year: 2024, oilRate: 2200, gasRate: 310 },
            { year: 2025, oilRate: 2000, gasRate: 290 },
            { year: 2026, oilRate: 1800, gasRate: 270 },
            { year: 2027, oilRate: 1600, gasRate: 250 },
        ],
        infrastructure: {
            nearestPipelineKm: 0,
            nearestRigKm: 18,
            nearestPortKm: 48,
            waterDepth: 0
        },
        risks: {
            technical: 2,
            commercial: 2,
            political: 1,
            regulatory: 2
        },
        description: "Strategic gas producer supplying the Dutch national grid. Small oil rim provides additional upside.",
        recentActivity: "Tie-in to Grijpskerk compressor station completed. Contract renegotiation ongoing."
    },

    "NOORD-FRIESLAND": {
        id: "blk-nf-001",
        name: "NOORD-FRIESLAND",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }, { name: "Shell Nederland", equity: 5 }],
        status: "Production",
        expiryDate: "2030-12-31",
        acreageSqKm: 1840,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 580,
            irr: 21,
            breakEvenPrice: 4.2,
            priceScenarios: [
                { price: 3, npv: 290 }, { price: 5, npv: 580 }, { price: 8, npv: 940 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1985, event: "First gas production", status: "completed" },
                { year: 2010, event: "Compression upgrade", status: "completed" },
                { year: 2027, event: "Infill drilling programme", status: "planned" },
            ],
            capex: 85,
            opex: 22,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 1420, gasReserves2P: 1850, contingentGas: 280 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 48 }, { year: 2021, oilRate: 0, gasRate: 44 },
            { year: 2022, oilRate: 0, gasRate: 41 }, { year: 2023, oilRate: 0, gasRate: 37 },
            { year: 2024, oilRate: 0, gasRate: 34 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 25, nearestPortKm: 35, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Prolific onshore gas block in the Frisian province. Slochteren Formation gas. Connected to Grijpskerk hub.",
        recentActivity: "Infill well NFSL-18 spud on schedule. Production ramp-up expected Q3 2025."
    },

    "N04": {
        id: "blk-n04-001",
        name: "N04",
        operator: "Wintershall Noordzee B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2028-06-30",
        acreageSqKm: 580,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 7,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 310,
            irr: 19,
            breakEvenPrice: 4.8,
            priceScenarios: [
                { price: 3, npv: 140 }, { price: 5, npv: 310 }, { price: 8, npv: 510 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1995, event: "Platform K4-A installed", status: "completed" },
                { year: 2018, event: "Compression enhancement", status: "completed" },
                { year: 2026, event: "License renewal application", status: "planned" },
            ],
            capex: 40,
            opex: 14,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 290, gasReserves2P: 420, contingentGas: 60 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 12 }, { year: 2021, oilRate: 0, gasRate: 11 },
            { year: 2022, oilRate: 0, gasRate: 10 }, { year: 2023, oilRate: 0, gasRate: 9 },
            { year: 2024, oilRate: 0, gasRate: 8 },
        ],
        infrastructure: { nearestPipelineKm: 38, nearestRigKm: 12, nearestPortKm: 58, waterDepth: 38 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Offshore Southern Gas Basin block with proven Rotliegend reservoir. Tie-back to Platform K6-A.",
        recentActivity: "License renewal under review by SodM. Production stable at 8 MMscf/day."
    },

    "N05": {
        id: "blk-n05-001",
        name: "N05",
        operator: "ONE-Dyas B.V.",
        partners: [{ name: "EBN", equity: 40 }, { name: "Neptune Energy", equity: 15 }],
        status: "Production",
        expiryDate: "2027-09-30",
        acreageSqKm: 640,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 7,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 260,
            irr: 17,
            breakEvenPrice: 4.6,
            priceScenarios: [
                { price: 3, npv: 115 }, { price: 5, npv: 260 }, { price: 8, npv: 420 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 2001, event: "N05-A platform commissioned", status: "completed" },
                { year: 2024, event: "Pipeline integrity inspection", status: "completed" },
                { year: 2027, event: "License expiry / renewal bid", status: "planned" },
            ],
            capex: 30,
            opex: 12,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 215, gasReserves2P: 310, contingentGas: 45 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 9 }, { year: 2021, oilRate: 0, gasRate: 8 },
            { year: 2022, oilRate: 0, gasRate: 8 }, { year: 2023, oilRate: 0, gasRate: 7 },
            { year: 2024, oilRate: 0, gasRate: 6 },
        ],
        infrastructure: { nearestPipelineKm: 42, nearestRigKm: 10, nearestPortKm: 62, waterDepth: 42 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Active gas production. Small field adjacent to N04. Slochteren sandstone play.",
        recentActivity: "Subsea manifold repair completed. Gas sales contract extended to 2027."
    },

    "N07a": {
        id: "blk-n07a-001",
        name: "N07a",
        operator: "Vermilion Energy Netherlands B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Active Exploration",
        expiryDate: "2029-03-31",
        acreageSqKm: 720,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 5,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 140,
            irr: 16,
            breakEvenPrice: 5.2,
            priceScenarios: [
                { price: 3, npv: 55 }, { price: 5, npv: 140 }, { price: 8, npv: 250 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 2022, event: "3D seismic acquisition", status: "completed" },
                { year: 2026, event: "Exploration well N07a-1", status: "planned" },
                { year: 2028, event: "Appraisal well (contingent)", status: "planned" },
            ],
            capex: 55,
            opex: 8,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves2P: 0, prospectiveGasMean: 180, contingentGas: 0 },
        production: [],
        infrastructure: { nearestPipelineKm: 55, nearestRigKm: 18, nearestPortKm: 72, waterDepth: 55 },
        risks: { technical: 4, commercial: 3, political: 1, regulatory: 2 },
        description: "Exploration license targeting Jurassic and Zechstein plays. Two exploration wells planned for 2026-2028.",
        recentActivity: "3D seismic interpretation complete. Two prospects identified with P50 resource of 180 bcf combined."
    },

    "N07b": {
        id: "blk-n07b-001",
        name: "N07b",
        operator: "Wintershall Noordzee B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Active Exploration",
        expiryDate: "2029-03-31",
        acreageSqKm: 680,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 5,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 195,
            irr: 17,
            breakEvenPrice: 5.0,
            priceScenarios: [
                { price: 3, npv: 85 }, { price: 5, npv: 195 }, { price: 8, npv: 330 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 2023, event: "3D seismic acquisition", status: "completed" },
                { year: 2026, event: "Exploration well N07b-1", status: "planned" },
            ],
            capex: 48,
            opex: 7,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { prospectiveGasMean: 250, contingentGas: 0 },
        production: [],
        infrastructure: { nearestPipelineKm: 52, nearestRigKm: 15, nearestPortKm: 68, waterDepth: 52 },
        risks: { technical: 3, commercial: 3, political: 1, regulatory: 2 },
        description: "Near-block to N07a. Rotliegend primary target. 3D seismic acquired 2023. Joint development with N07a under evaluation.",
        recentActivity: "Seismic processing finalized. Farm-in discussions with two European operators ongoing."
    },

    "M09a": {
        id: "blk-m09a-001",
        name: "M09a",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2031-12-31",
        acreageSqKm: 920,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 490,
            irr: 20,
            breakEvenPrice: 4.0,
            priceScenarios: [
                { price: 3, npv: 240 }, { price: 5, npv: 490 }, { price: 8, npv: 790 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1979, event: "First gas production", status: "completed" },
                { year: 2015, event: "Gas compressor upgrade", status: "completed" },
                { year: 2028, event: "Decommissioning study", status: "planned" },
            ],
            capex: 60,
            opex: 18,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 490, gasReserves2P: 680, contingentGas: 95 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 19 }, { year: 2021, oilRate: 0, gasRate: 18 },
            { year: 2022, oilRate: 0, gasRate: 17 }, { year: 2023, oilRate: 0, gasRate: 15 },
            { year: 2024, oilRate: 0, gasRate: 14 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 20, nearestPortKm: 32, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Onshore gas block in Friesland province. Multiple Rotliegend wells in production.",
        recentActivity: "Annual well integrity survey completed. Minor pipeline repair at M09-6 wellhead."
    },

    "M10a, M10b & M11": {
        id: "blk-m10-001",
        name: "M10a, M10b & M11",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2032-06-30",
        acreageSqKm: 1480,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 840,
            irr: 22,
            breakEvenPrice: 3.8,
            priceScenarios: [
                { price: 3, npv: 420 }, { price: 5, npv: 840 }, { price: 8, npv: 1380 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1972, event: "First production", status: "completed" },
                { year: 2008, event: "Compression station upgrade", status: "completed" },
                { year: 2030, event: "Enhanced gas recovery programme", status: "planned" },
            ],
            capex: 120,
            opex: 28,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { oilReserves2P: 18, gasReserves1P: 960, gasReserves2P: 1240, contingentGas: 180 },
        production: [
            { year: 2020, oilRate: 480, gasRate: 35 }, { year: 2021, oilRate: 440, gasRate: 33 },
            { year: 2022, oilRate: 410, gasRate: 30 }, { year: 2023, oilRate: 375, gasRate: 28 },
            { year: 2024, oilRate: 340, gasRate: 25 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 18, nearestPortKm: 28, waterDepth: 0 },
        risks: { technical: 1, commercial: 2, political: 1, regulatory: 2 },
        description: "Large consolidated onshore license. Primary driver of Netherlands domestic gas supply from the Groningen-periphery cluster.",
        recentActivity: "EGR pilot injection commenced at M11-7. Results promising with 8% uplift in recovery factor."
    },

    "LEEUWARDEN": {
        id: "blk-lw-001",
        name: "LEEUWARDEN",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2030-09-30",
        acreageSqKm: 620,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 370,
            irr: 21,
            breakEvenPrice: 4.1,
            priceScenarios: [
                { price: 3, npv: 180 }, { price: 5, npv: 370 }, { price: 8, npv: 600 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1988, event: "First gas production", status: "completed" },
                { year: 2019, event: "Gathering network extension", status: "completed" },
                { year: 2029, event: "License renewal / P&A assessment", status: "planned" },
            ],
            capex: 45,
            opex: 16,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { oilReserves2P: 4, gasReserves1P: 340, gasReserves2P: 480, contingentGas: 70 },
        production: [
            { year: 2020, oilRate: 120, gasRate: 14 }, { year: 2021, oilRate: 110, gasRate: 13 },
            { year: 2022, oilRate: 98, gasRate: 12 }, { year: 2023, oilRate: 88, gasRate: 11 },
            { year: 2024, oilRate: 78, gasRate: 10 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 22, nearestPortKm: 30, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "City-adjacent onshore gas. Production via existing NAM gathering network. Frisian Slochteren reservoir.",
        recentActivity: "New LW-12 well drilled and tested at 2.1 MMscf/day. Connected to Leeuwarden compressor station."
    },

    "BARRADEEL": {
        id: "blk-bd-001",
        name: "BARRADEEL",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2029-12-31",
        acreageSqKm: 340,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 152,
            irr: 19,
            breakEvenPrice: 4.3,
            priceScenarios: [
                { price: 3, npv: 70 }, { price: 5, npv: 152 }, { price: 8, npv: 250 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1992, event: "First production", status: "completed" },
                { year: 2021, event: "Well recompletion program", status: "completed" },
                { year: 2028, event: "License renewal or P&A", status: "planned" },
            ],
            capex: 20,
            opex: 8,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { oilReserves2P: 2, gasReserves1P: 140, gasReserves2P: 195, contingentGas: 25 },
        production: [
            { year: 2020, oilRate: 55, gasRate: 5.5 }, { year: 2021, oilRate: 50, gasRate: 5.0 },
            { year: 2022, oilRate: 44, gasRate: 4.4 }, { year: 2023, oilRate: 40, gasRate: 4.0 },
            { year: 2024, oilRate: 35, gasRate: 3.5 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 25, nearestPortKm: 38, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Onshore gas block adjacent to BARRADEEL II. Part of the larger Frisian gas system.",
        recentActivity: "Gas gathering pipeline integrity confirmed. Production decline in line with type-curve."
    },

    "BARRADEEL II": {
        id: "blk-bd2-001",
        name: "BARRADEEL II",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2028-12-31",
        acreageSqKm: 380,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 175,
            irr: 19,
            breakEvenPrice: 4.3,
            priceScenarios: [
                { price: 3, npv: 80 }, { price: 5, npv: 175 }, { price: 8, npv: 290 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1994, event: "Field development approval", status: "completed" },
                { year: 2020, event: "EOR water flooding pilot", status: "completed" },
                { year: 2027, event: "License renewal decision", status: "planned" },
            ],
            capex: 22,
            opex: 9,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { oilReserves2P: 2, gasReserves1P: 155, gasReserves2P: 220, contingentGas: 30 },
        production: [
            { year: 2020, oilRate: 60, gasRate: 6.2 }, { year: 2021, oilRate: 55, gasRate: 5.8 },
            { year: 2022, oilRate: 50, gasRate: 5.2 }, { year: 2023, oilRate: 45, gasRate: 4.8 },
            { year: 2024, oilRate: 40, gasRate: 4.2 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 24, nearestPortKm: 36, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Small onshore gas producing block in North Friesland. Mature field with EOR enhancement potential.",
        recentActivity: "Water flooding EOR pilot showing 12% improved recovery. Considering phase 2 expansion."
    },

    "DE MARNE": {
        id: "blk-dm-001",
        name: "DE MARNE",
        operator: "Petrogas E&P Netherlands B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Active Exploration",
        expiryDate: "2027-06-30",
        acreageSqKm: 440,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 5,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 62,
            irr: 15,
            breakEvenPrice: 5.8,
            priceScenarios: [
                { price: 3, npv: 20 }, { price: 5, npv: 62 }, { price: 8, npv: 120 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 2021, event: "2D seismic reprocessing", status: "completed" },
                { year: 2025, event: "Exploration well DM-1", status: "planned" },
            ],
            capex: 28,
            opex: 5,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { prospectiveGasMean: 85, contingentGas: 0 },
        production: [],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 30, nearestPortKm: 28, waterDepth: 0 },
        risks: { technical: 3, commercial: 3, political: 1, regulatory: 2 },
        description: "Onshore exploration with Rotliegend sandstone targets. Groningen periphery play. Drill-or-drop decision due 2025.",
        recentActivity: "Seismic attribute study completed. Prospect DM-A mapped at P50 volume of 85 Bcf."
    },

    "TIETJERKSTERADEEL II": {
        id: "blk-tk2-001",
        name: "TIETJERKSTERADEEL II",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2029-06-30",
        acreageSqKm: 290,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 108,
            irr: 18,
            breakEvenPrice: 4.4,
            priceScenarios: [
                { price: 3, npv: 48 }, { price: 5, npv: 108 }, { price: 8, npv: 182 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1997, event: "Production start", status: "completed" },
                { year: 2022, event: "Gas metering upgrade", status: "completed" },
                { year: 2028, event: "Tail production assessment", status: "planned" },
            ],
            capex: 14,
            opex: 6,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 95, gasReserves2P: 140, contingentGas: 18 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 4.0 }, { year: 2021, oilRate: 0, gasRate: 3.7 },
            { year: 2022, oilRate: 0, gasRate: 3.4 }, { year: 2023, oilRate: 0, gasRate: 3.1 },
            { year: 2024, oilRate: 0, gasRate: 2.8 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 28, nearestPortKm: 32, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Onshore gas production Drenthe basin. Tied into NAM regional gathering system. Mature, stable production.",
        recentActivity: "Well TK-5 workover completed. Production rate restored to plateau at 2.8 MMscf/day."
    },

    "OOSTEREND": {
        id: "blk-oo-001",
        name: "OOSTEREND",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2028-03-31",
        acreageSqKm: 210,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 74,
            irr: 17,
            breakEvenPrice: 4.5,
            priceScenarios: [
                { price: 3, npv: 30 }, { price: 5, npv: 74 }, { price: 8, npv: 125 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1991, event: "First gas production", status: "completed" },
                { year: 2024, event: "Subsurface re-evaluation", status: "completed" },
                { year: 2027, event: "P&A or license renewal", status: "planned" },
            ],
            capex: 8,
            opex: 4,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 60, gasReserves2P: 95, contingentGas: 10 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 2.8 }, { year: 2021, oilRate: 0, gasRate: 2.5 },
            { year: 2022, oilRate: 0, gasRate: 2.2 }, { year: 2023, oilRate: 0, gasRate: 1.9 },
            { year: 2024, oilRate: 0, gasRate: 1.7 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 30, nearestPortKm: 40, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Small gas producer on Wadden Sea coast. Mature field, late-life production. Minimal remaining reserves.",
        recentActivity: "Economic life extension analysis ongoing. Low abandonment cost estimated at €4M."
    },

    "NORG": {
        id: "blk-norg-001",
        name: "NORG",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }, { name: "Vermilion", equity: 10 }],
        status: "Production",
        expiryDate: "2035-06-30",
        acreageSqKm: 1120,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 1840,
            irr: 23,
            breakEvenPrice: 3.6,
            priceScenarios: [
                { price: 3, npv: 950 }, { price: 5, npv: 1840 }, { price: 8, npv: 3100 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1976, event: "Norg field discovery", status: "completed" },
                { year: 1997, event: "Underground gas storage commissioned", status: "completed" },
                { year: 2028, event: "UGS capacity expansion", status: "planned" },
            ],
            capex: 180,
            opex: 35,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { oilReserves2P: 14, gasReserves1P: 2600, gasReserves2P: 3200, contingentGas: 450 },
        production: [
            { year: 2020, oilRate: 380, gasRate: 92 }, { year: 2021, oilRate: 350, gasRate: 88 },
            { year: 2022, oilRate: 320, gasRate: 85 }, { year: 2023, oilRate: 290, gasRate: 80 },
            { year: 2024, oilRate: 265, gasRate: 75 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 15, nearestPortKm: 25, waterDepth: 0 },
        risks: { technical: 1, commercial: 2, political: 1, regulatory: 2 },
        description: "High-capacity gas storage and production. Norg reservoir is one of Europe's largest underground gas storage sites. Strategic asset for Dutch energy security.",
        recentActivity: "Record seasonal injection of 2.8 Bcm completed. Winter withdrawal on track. UGS expansion permit filed."
    },

    "WASKEMEER": {
        id: "blk-wm-001",
        name: "WASKEMEER",
        operator: "Vermilion Energy Netherlands B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2031-12-31",
        acreageSqKm: 180,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 4,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 85,
            irr: 20,
            breakEvenPrice: 4.0,
            priceScenarios: [
                { price: 3, npv: 38 }, { price: 5, npv: 85 }, { price: 8, npv: 148 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 2003, event: "Oil field development approval", status: "completed" },
                { year: 2018, event: "Water injection commenced", status: "completed" },
                { year: 2029, event: "EOR assessment", status: "planned" },
            ],
            capex: 24,
            opex: 8,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { oilReserves1P: 4, oilReserves2P: 6, gasReserves2P: 28, contingentGas: 12 },
        production: [
            { year: 2020, oilRate: 680, gasRate: 0.8 }, { year: 2021, oilRate: 620, gasRate: 0.7 },
            { year: 2022, oilRate: 570, gasRate: 0.7 }, { year: 2023, oilRate: 520, gasRate: 0.6 },
            { year: 2024, oilRate: 475, gasRate: 0.5 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 32, nearestPortKm: 38, waterDepth: 0 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Onshore oil and gas producer in Drenthe. Small Zechstein oil rim with gas cap. Water injection for pressure support.",
        recentActivity: "Water injection optimized. Monthly oil production averaged 475 bopd in Q4 2024."
    },

    "N04, N05 & N08": {
        id: "blk-n045n8-001",
        name: "N04, N05 & N08",
        operator: "ONE-Dyas B.V.",
        partners: [{ name: "EBN", equity: 40 }, { name: "Neptune Energy", equity: 15 }],
        status: "Production",
        expiryDate: "2028-09-30",
        acreageSqKm: 1840,
        fiscalTerms: {
            pscType: "Cost Recovery",
            royaltyRate: 7,
            taxRate: 25.8,
            domesticMarketObligation: 100,
        },
        economics: {
            npv10: 620,
            irr: 20,
            breakEvenPrice: 4.5,
            priceScenarios: [
                { price: 3, npv: 290 }, { price: 5, npv: 620 }, { price: 8, npv: 1050 }
            ]
        },
        developmentPlan: {
            milestones: [
                { year: 1998, event: "N05-A platform installed", status: "completed" },
                { year: 2014, event: "N08 satellite tie-back", status: "completed" },
                { year: 2027, event: "License renewal bid preparation", status: "planned" },
            ],
            capex: 75,
            opex: 22,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 640, gasReserves2P: 890, contingentGas: 110 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 25 }, { year: 2021, oilRate: 0, gasRate: 23 },
            { year: 2022, oilRate: 0, gasRate: 21 }, { year: 2023, oilRate: 0, gasRate: 19 },
            { year: 2024, oilRate: 0, gasRate: 18 },
        ],
        infrastructure: { nearestPipelineKm: 40, nearestRigKm: 10, nearestPortKm: 60, waterDepth: 40 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Combined offshore license cluster. Gas production from Slochteren via platform K5-A. Strategic N08 satellite adds upside reserves.",
        recentActivity: "N08 subsea well N08-2 successfully drilled. Gas rate 3.2 MMscf/day above prognosis."
    },

    "L13": {
        id: "blk-l13-001",
        name: "L13",
        operator: "ONE-Dyas B.V.",
        partners: [{ name: "EBN", equity: 40 }, { name: "Neptune Energy", equity: 10 }],
        status: "Active Exploration",
        expiryDate: "2030-09-30",
        acreageSqKm: 820,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 7, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 225, irr: 18, breakEvenPrice: 5.0,
            priceScenarios: [{ price: 3, npv: 95 }, { price: 5, npv: 225 }, { price: 8, npv: 390 }]
        },
        developmentPlan: {
            milestones: [
                { year: 2022, event: "3D seismic acquisition", status: "completed" },
                { year: 2024, event: "Seismic interpretation & prospect mapping", status: "completed" },
                { year: 2026, event: "Exploration well L13-1", status: "planned" },
                { year: 2028, event: "Appraisal / FID (contingent)", status: "planned" },
            ],
            capex: 62, opex: 9,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { prospectiveGasMean: 195, contingentGas: 0 },
        production: [],
        infrastructure: { nearestPipelineKm: 48, nearestRigKm: 20, nearestPortKm: 65, waterDepth: 48 },
        risks: { technical: 3, commercial: 3, political: 1, regulatory: 2 },
        description: "Offshore Southern Gas Basin exploration block. Primary targets are Rotliegend sandstone and Zechstein carbonate reservoirs. Two mapped prospects with combined P50 upside of ~195 Bcf.",
        recentActivity: "Prospect L13-N mapped at P50 of 120 Bcf. Farm-in process launched Q1 2025. Environmental baseline survey complete."
    },

    "L10-ALBE": {
        id: "blk-l10albe-001",
        name: "L10-ALBE",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2031-03-31",
        acreageSqKm: 340,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 7, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 420, irr: 22, breakEvenPrice: 4.1,
            priceScenarios: [{ price: 3, npv: 195 }, { price: 5, npv: 420 }, { price: 8, npv: 720 }]
        },
        developmentPlan: {
            milestones: [
                { year: 1987, event: "Albe field discovery", status: "completed" },
                { year: 1991, event: "Platform L10-A installed", status: "completed" },
                { year: 2027, event: "Infill well L10-ALBE-6", status: "planned" },
            ],
            capex: 55, opex: 16,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 320, gasReserves2P: 480, contingentGas: 65 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 13 }, { year: 2021, oilRate: 0, gasRate: 12 },
            { year: 2022, oilRate: 0, gasRate: 11 }, { year: 2023, oilRate: 0, gasRate: 10 },
            { year: 2024, oilRate: 0, gasRate: 9 },
        ],
        infrastructure: { nearestPipelineKm: 30, nearestRigKm: 12, nearestPortKm: 50, waterDepth: 30 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Albe gas field, Southern North Sea. Producing from Rotliegend via L10-A platform. Established infrastructure with remaining upside in deeper Zechstein.",
        recentActivity: "3D seismic reprocessing revealed Zechstein upside. Operator evaluating infill well for 2027."
    },

    "L10a, L10b & L11a": {
        id: "blk-l10l11-001",
        name: "L10a, L10b & L11a",
        operator: "Shell Nederland Aardolie Maatschappij",
        partners: [{ name: "EBN", equity: 40 }, { name: "ExxonMobil", equity: 15 }],
        status: "Production",
        expiryDate: "2032-06-30",
        acreageSqKm: 1640,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 7, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 780, irr: 21, breakEvenPrice: 4.0,
            priceScenarios: [{ price: 3, npv: 360 }, { price: 5, npv: 780 }, { price: 8, npv: 1300 }]
        },
        developmentPlan: {
            milestones: [
                { year: 1982, event: "First production L10", status: "completed" },
                { year: 2005, event: "L11a tie-back to L10-G platform", status: "completed" },
                { year: 2028, event: "Enhanced recovery programme", status: "planned" },
            ],
            capex: 110, opex: 28,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 620, gasReserves2P: 920, contingentGas: 130 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 28 }, { year: 2021, oilRate: 0, gasRate: 26 },
            { year: 2022, oilRate: 0, gasRate: 24 }, { year: 2023, oilRate: 0, gasRate: 21 },
            { year: 2024, oilRate: 0, gasRate: 19 },
        ],
        infrastructure: { nearestPipelineKm: 35, nearestRigKm: 8, nearestPortKm: 55, waterDepth: 35 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Large consolidated offshore license cluster. Multiple Rotliegend Slochteren gas fields. L10-G platform serves as production hub for southern sub-blocks.",
        recentActivity: "L10-G compressor upgrade completed. Plateau production maintained at 19 MMscf/day."
    },

    "L11b": {
        id: "blk-l11b-001",
        name: "L11b",
        operator: "Wintershall Noordzee B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Production",
        expiryDate: "2029-12-31",
        acreageSqKm: 520,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 7, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 310, irr: 19, breakEvenPrice: 4.5,
            priceScenarios: [{ price: 3, npv: 140 }, { price: 5, npv: 310 }, { price: 8, npv: 520 }]
        },
        developmentPlan: {
            milestones: [
                { year: 1999, event: "Platform L11-B installed", status: "completed" },
                { year: 2020, event: "Subsea well L11b-4", status: "completed" },
                { year: 2027, event: "License extension review", status: "planned" },
            ],
            capex: 42, opex: 14,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 215, gasReserves2P: 340, contingentGas: 50 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 10 }, { year: 2021, oilRate: 0, gasRate: 9 },
            { year: 2022, oilRate: 0, gasRate: 8 }, { year: 2023, oilRate: 0, gasRate: 8 },
            { year: 2024, oilRate: 0, gasRate: 7 },
        ],
        infrastructure: { nearestPipelineKm: 40, nearestRigKm: 14, nearestPortKm: 58, waterDepth: 40 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Offshore gas block, Southern Gas Basin. Rotliegend Slochteren primary reservoir. Production exported via NOGAT pipeline.",
        recentActivity: "NOGAT tariff renegotiation completed. Production stable at 7 MMscf/day."
    },

    "L11c": {
        id: "blk-l11c-001",
        name: "L11c",
        operator: "ONE-Dyas B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Active Exploration",
        expiryDate: "2028-06-30",
        acreageSqKm: 460,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 5, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 145, irr: 16, breakEvenPrice: 5.2,
            priceScenarios: [{ price: 3, npv: 55 }, { price: 5, npv: 145 }, { price: 8, npv: 260 }]
        },
        developmentPlan: {
            milestones: [
                { year: 2023, event: "3D seismic reprocessing", status: "completed" },
                { year: 2026, event: "Exploration well L11c-1", status: "planned" },
            ],
            capex: 40, opex: 7,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { prospectiveGasMean: 145, contingentGas: 0 },
        production: [],
        infrastructure: { nearestPipelineKm: 42, nearestRigKm: 16, nearestPortKm: 60, waterDepth: 42 },
        risks: { technical: 3, commercial: 3, political: 1, regulatory: 2 },
        description: "Exploration block adjacent to producing L11b. Rotliegend prospect mapped at P50 of 145 Bcf. Stratigraphic trapping concept under study.",
        recentActivity: "Seismic attribute analysis confirms prospect integrity. Drill decision expected H2 2025."
    },

    "L11d": {
        id: "blk-l11d-001",
        name: "L11d",
        operator: "Vermilion Energy Netherlands B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Open Area",
        expiryDate: "2027-12-31",
        acreageSqKm: 510,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 5, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 95, irr: 14, breakEvenPrice: 5.5,
            priceScenarios: [{ price: 3, npv: 30 }, { price: 5, npv: 95 }, { price: 8, npv: 175 }]
        },
        developmentPlan: {
            milestones: [
                { year: 2025, event: "Open block tender", status: "planned" },
                { year: 2027, event: "Exploration well (post-award)", status: "planned" },
            ],
            capex: 35, opex: 6,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { prospectiveGasMean: 100, contingentGas: 0 },
        production: [],
        infrastructure: { nearestPipelineKm: 45, nearestRigKm: 18, nearestPortKm: 62, waterDepth: 45 },
        risks: { technical: 4, commercial: 3, political: 1, regulatory: 2 },
        description: "Open block in Southern Gas Basin, available under SodM tender process. Limited seismic coverage — upside remains largely undrilled. Rotliegend play concept.",
        recentActivity: "Block included in 2025 Offshore Licensing Round. Information package available in NDR."
    },

    "K18a, L16a, L17a, P03a, Q01, Q02a, Q04 & Q05a": {
        id: "blk-k18-multi-001",
        name: "K18a, L16a, L17a, P03a, Q01, Q02a, Q04 & Q05a",
        operator: "Nederlandse Aardolie Maatschappij (NAM)",
        partners: [{ name: "EBN", equity: 40 }, { name: "Shell", equity: 20 }],
        status: "Production",
        expiryDate: "2033-12-31",
        acreageSqKm: 4820,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 4, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 2150, irr: 23, breakEvenPrice: 3.8,
            priceScenarios: [{ price: 3, npv: 1050 }, { price: 5, npv: 2150 }, { price: 8, npv: 3800 }]
        },
        developmentPlan: {
            milestones: [
                { year: 1975, event: "Block cluster first production", status: "completed" },
                { year: 2018, event: "Central processing facility upgrade", status: "completed" },
                { year: 2030, event: "Late-life production strategy review", status: "planned" },
            ],
            capex: 220, opex: 55,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { oilReserves2P: 35, gasReserves1P: 2800, gasReserves2P: 3850, contingentGas: 550 },
        production: [
            { year: 2020, oilRate: 920, gasRate: 115 }, { year: 2021, oilRate: 850, gasRate: 108 },
            { year: 2022, oilRate: 780, gasRate: 100 }, { year: 2023, oilRate: 720, gasRate: 92 },
            { year: 2024, oilRate: 660, gasRate: 86 },
        ],
        infrastructure: { nearestPipelineKm: 0, nearestRigKm: 10, nearestPortKm: 22, waterDepth: 0 },
        risks: { technical: 1, commercial: 2, political: 1, regulatory: 2 },
        description: "Mega-license cluster spanning onshore and near-shore Netherlands. Multiple Rotliegend gas fields and shallow oil rim. Core production asset of the Dutch national grid supply.",
        recentActivity: "Q01-deep well encountering 42m net pay in Rotliegend. Pilot EOR scheme at Q04 showing 11% improved sweep efficiency."
    },

    "L07e & L08f": {
        id: "blk-l07e08f-001",
        name: "L07e & L08f",
        operator: "Neptune Energy Netherlands B.V.",
        partners: [{ name: "EBN", equity: 40 }, { name: "Wintershall", equity: 10 }],
        status: "Production",
        expiryDate: "2030-06-30",
        acreageSqKm: 740,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 7, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 380, irr: 20, breakEvenPrice: 4.3,
            priceScenarios: [{ price: 3, npv: 170 }, { price: 5, npv: 380 }, { price: 8, npv: 650 }]
        },
        developmentPlan: {
            milestones: [
                { year: 2000, event: "Combined platform L07-E installed", status: "completed" },
                { year: 2019, event: "L08f satellite tieback", status: "completed" },
                { year: 2028, event: "Infill drilling programme", status: "planned" },
            ],
            capex: 50, opex: 15,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 260, gasReserves2P: 390, contingentGas: 55 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 11 }, { year: 2021, oilRate: 0, gasRate: 10 },
            { year: 2022, oilRate: 0, gasRate: 9 }, { year: 2023, oilRate: 0, gasRate: 8 },
            { year: 2024, oilRate: 0, gasRate: 8 },
        ],
        infrastructure: { nearestPipelineKm: 36, nearestRigKm: 12, nearestPortKm: 52, waterDepth: 36 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Combined offshore license. L07-E platform produces from Rotliegend Slochteren. L08f satellite adds step-out reserves.",
        recentActivity: "L08f-3 well recompleted to Rotliegend-B formation. Rates improved by 1.4 MMscf/day."
    },

    "L08a & L08c": {
        id: "blk-l08ac-001",
        name: "L08a & L08c",
        operator: "Vermilion Energy Netherlands B.V.",
        partners: [{ name: "EBN", equity: 40 }],
        status: "Active Exploration",
        expiryDate: "2028-12-31",
        acreageSqKm: 680,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 5, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 160, irr: 16, breakEvenPrice: 5.1,
            priceScenarios: [{ price: 3, npv: 65 }, { price: 5, npv: 160 }, { price: 8, npv: 280 }]
        },
        developmentPlan: {
            milestones: [
                { year: 2022, event: "3D seismic acquisition", status: "completed" },
                { year: 2026, event: "Exploration well L08a-1", status: "planned" },
            ],
            capex: 42, opex: 7,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { prospectiveGasMean: 160, contingentGas: 0 },
        production: [],
        infrastructure: { nearestPipelineKm: 38, nearestRigKm: 16, nearestPortKm: 54, waterDepth: 38 },
        risks: { technical: 3, commercial: 3, political: 1, regulatory: 2 },
        description: "Exploration block pair in Southern Gas Basin. Rotliegend primary target. Close to L07-E hub for potential tie-back development.",
        recentActivity: "Seismic amplitude processing complete. Prospect L08a-N shows AVO Class II anomaly confirming gas charge."
    },

    "L08b, L08d & L08e": {
        id: "blk-l08bde-001",
        name: "L08b, L08d & L08e",
        operator: "ONE-Dyas B.V.",
        partners: [{ name: "EBN", equity: 40 }, { name: "Neptune Energy", equity: 10 }],
        status: "Production",
        expiryDate: "2031-09-30",
        acreageSqKm: 1080,
        fiscalTerms: { pscType: "Cost Recovery", royaltyRate: 7, taxRate: 25.8, domesticMarketObligation: 100 },
        economics: {
            npv10: 540, irr: 20, breakEvenPrice: 4.2,
            priceScenarios: [{ price: 3, npv: 250 }, { price: 5, npv: 540 }, { price: 8, npv: 920 }]
        },
        developmentPlan: {
            milestones: [
                { year: 1996, event: "L08b-A platform commissioned", status: "completed" },
                { year: 2012, event: "L08d satellite tie-back", status: "completed" },
                { year: 2028, event: "L08e subsea development", status: "planned" },
            ],
            capex: 80, opex: 20,
        },
        contact: { agency: "National Data Room", role: "Data Room Operator", email: "invest@ndr.nl", phone: "+31 70 379 8900" },
        resources: { gasReserves1P: 380, gasReserves2P: 560, contingentGas: 80 },
        production: [
            { year: 2020, oilRate: 0, gasRate: 16 }, { year: 2021, oilRate: 0, gasRate: 15 },
            { year: 2022, oilRate: 0, gasRate: 14 }, { year: 2023, oilRate: 0, gasRate: 12 },
            { year: 2024, oilRate: 0, gasRate: 11 },
        ],
        infrastructure: { nearestPipelineKm: 38, nearestRigKm: 10, nearestPortKm: 55, waterDepth: 38 },
        risks: { technical: 2, commercial: 2, political: 1, regulatory: 2 },
        description: "Multi-block offshore license. L08b anchor field with L08d satellite. L08e represents brownfield step-out development opportunity with 80 Bcf incremental upside.",
        recentActivity: "L08e subsea concept select completed. FEED approved for 2026 start."
    }
}


