export type BlockStatus = "Active Exploration" | "Open Area" | "Production" | "Development"

export interface FiscalTerms {
    pscType: "Cost Recovery" | "Gross Split"
    royaltyRate: number // percentage
    taxRate: number // percentage
    costRecoveryCap?: number // percentage
    ftp?: number // First Tranche Petroleum percentage
    domesticMarketObligation: number // percentage
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
            domesticMarketObligation: 25
        },
        resources: {
            oilReserves2P: 120,
            gasReserves2P: 3500,
            contingentGas: 1200
        },
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
            domesticMarketObligation: 25
        },
        resources: {
            prospectiveGasMean: 4500,
            prospectiveOilMean: 150
        },
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
            domesticMarketObligation: 25
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
    }
}
