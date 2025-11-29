import { CheckCircle, Clock, AlertTriangle, Send } from "lucide-react"

export interface Activity {
  title: string
  statusText: string
  time: string
  author: string
  icon: React.ElementType
  iconColor: string
  status: "completed" | "processing" | "flagged"
  read: boolean
  submissionDetails: {
    title: string
    selectedFiles: string
    discipline: string
    confidentiality: string
    dataType: string
    dataSource: string
    reviewer: string
    approver: string
    cc: string
    remarks?: string
    systemProcess?: string
    detectedIssues?: string[]
  }
}

export const activities: Activity[] = [
  {
    title: "Suriname Block Analysis",
    statusText: "Completed",
    time: "2 hrs ago",
    author: "Dr. Sarah Chen",
    icon: CheckCircle,
    iconColor: "text-green-500",
    status: "completed",
    read: false,
    submissionDetails: {
      title: "Suriname Block Geological Analysis",
      selectedFiles: "suriname_blocks.shp, suriname_geology.csv (2 files)",
      discipline: "Geology",
      confidentiality: "Internal Use Only",
      dataType: "Internal Data",
      dataSource: "IHS Markit",
      reviewer: "Dr. Sarah Chen",
      approver: "Prof. Ahmad Rahman",
      cc: "geology-team@petronas.com",
      remarks:
        "Comprehensive geological analysis of Suriname offshore blocks including structural interpretation and prospect mapping.",
    },
  },
  {
    title: "Well Data Upload",
    statusText: "Completed",
    time: "09:30 AM",
    author: "Eng. Lim Wei Ming",
    icon: CheckCircle,
    iconColor: "text-green-500",
    status: "completed",
    read: true,
    submissionDetails: {
      title: "Balingian Basin Well Data Integration",
      selectedFiles: "well_logs.las, completion_data.xlsx (2 files)",
      discipline: "Reservoir Engineering",
      confidentiality: "Confidential",
      dataType: "Internal Data",
      dataSource: "Schlumberger",
      reviewer: "Eng. Lim Wei Ming",
      approver: "Dr. Fatimah Zahra",
      cc: "reservoir-team@petronas.com",
      remarks: "Well log data from 15 wells in Balingian Basin with completion and production history.",
    },
  },
  {
    title: "Geological Feature Update",
    statusText: "Processing",
    time: "5 hrs ago",
    author: "Dr. Raj Kumar",
    icon: Clock,
    iconColor: "text-blue-500",
    status: "processing",
    read: false,
    submissionDetails: {
      title: "Structural Features Mapping Update",
      selectedFiles: "fault_systems.shp, horizon_picks.dat (2 files)",
      discipline: "Geophysics",
      confidentiality: "Internal Use Only",
      dataType: "Internal Data",
      dataSource: "CGG",
      reviewer: "Dr. Raj Kumar",
      approver: "Eng. Siti Nurhaliza",
      cc: "geophysics-team@petronas.com",
      remarks: "Updated structural interpretation based on latest 3D seismic reprocessing results.",
    },
  },
  {
    title: "Pyrolysis Dataset Import",
    statusText: "Processing",
    time: "11:00 AM",
    author: "Dr. Chen Li Hua",
    icon: Clock,
    iconColor: "text-blue-500",
    status: "processing",
    read: true,
    submissionDetails: {
      title: "Rock-Eval Pyrolysis Analysis Results",
      selectedFiles: "pyrolysis_results.csv, sample_locations.xlsx (2 files)",
      discipline: "Geochemistry",
      confidentiality: "Confidential",
      dataType: "External Data",
      dataSource: "Weatherford Labs",
      reviewer: "Dr. Chen Li Hua",
      approver: "Prof. Ibrahim Hassan",
      cc: "geochem-team@petronas.com",
      remarks: "Source rock evaluation data from 45 core samples across multiple formations.",
    },
  },
  {
    title: "Balingian Basin Wells",
    statusText: "Flagged",
    time: "12:15 PM",
    author: "Dr. Fatimah Zahra",
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    status: "flagged",
    read: false,
    submissionDetails: {
      title: "Balingian Basin Well Data Review",
      selectedFiles: "balingian_wells.shp, well_data.xlsx (2 files)",
      discipline: "Geology",
      confidentiality: "Confidential",
      dataType: "Internal Data",
      dataSource: "Petronas",
      reviewer: "Dr. Fatimah Zahra",
      approver: "Awaiting Review",
      cc: "geology-team@petronas.com",
      systemProcess: "Overlapping Coordinates Detected",
      detectedIssues: [
        "Well coordinates overlap with existing wells: BALI-001, BALI-003",
        "Coordinate tolerance exceeded by 15.2 meters",
      ],
    },
  },
]
