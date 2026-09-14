/**
 * KUCCPS Complete Reference Data 2025
 * Based on the official 19 Degree Clusters and 2024/2025 placement cycle data.
 */

export interface KUCCPSCluster {
  id: string;
  name: string;
  subjects: string[];
  minRequirements?: Record<string, string>;
  programmes: string[];
}

export interface UniversityStrength {
  name: string;
  departments: string[];
  rank?: number;
}

export const KUCCPS_CLUSTERS: KUCCPSCluster[] = [
  {
    id: "1",
    name: "Law",
    subjects: ["English/Kiswahili", "Mathematics/Group II", "Any Group III", "Group II/III/IV/V"],
    minRequirements: { "English": "B", "Kiswahili": "B" },
    programmes: ["Bachelor of Laws (LLB)"]
  },
  {
    id: "2",
    name: "Business, Hospitality & Tourism",
    subjects: ["English/Kiswahili", "Mathematics", "Any Group II/III", "Group II/III/IV/V"],
    minRequirements: { "Mathematics": "C" },
    programmes: ["B.Commerce", "BBA", "Procurement", "Hospitality Management", "Tourism"]
  },
  {
    id: "3",
    name: "Communication, Media & Arts",
    subjects: ["English/Kiswahili", "Mathematics/Group II", "Any Group III", "Group II/III/IV/V"],
    minRequirements: { "English": "C+", "Kiswahili": "C+" },
    programmes: ["Journalism", "International Relations", "Mass Communication", "Fine Arts", "Graphic Design"]
  },
  {
    id: "4",
    name: "Geosciences",
    subjects: ["Mathematics", "Physics", "Biology/Chemistry/Geography", "Group II/III/IV/V"],
    minRequirements: { "Mathematics": "C+", "Physics": "C+" },
    programmes: ["Geospatial Information Science", "Meteorology", "Geology", "Astronomy"]
  },
  {
    id: "5",
    name: "Engineering & Technology",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology/Group III/IV/V"],
    minRequirements: { "Mathematics": "C+", "Physics": "C+", "Chemistry": "C+", "English": "C+", "Kiswahili": "C+" },
    programmes: ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Mechatronics", "Aeronautical"]
  },
  {
    id: "6",
    name: "Architecture & Built Environment",
    subjects: ["Mathematics", "Physics", "Any Group III", "Group II/III/IV/V"],
    minRequirements: { "Mathematics": "C+", "Physics": "C+" },
    programmes: ["Architecture", "Quantity Surveying", "Construction Management", "Real Estate"]
  },
  {
    id: "7",
    name: "Computer Science & IT",
    subjects: ["Mathematics", "Physics/Group II", "Any Group III", "Group II/III/IV/V"],
    minRequirements: { "Mathematics": "C+", "Physics": "C+" },
    programmes: ["Computer Science", "Software Engineering", "Cyber Security", "Data Science", "IT"]
  },
  {
    id: "10",
    name: "Actuarial Science & Economics",
    subjects: ["Mathematics", "Group II/III", "Any Group III", "Group II/III/IV/V"],
    minRequirements: { "Mathematics": "C+" },
    programmes: ["Actuarial Science", "Statistics", "Economics", "Finance", "Accounting"]
  },
  {
    id: "13",
    name: "Medicine & Health Sciences",
    subjects: ["Biology", "Chemistry", "Mathematics/Physics", "English/Kiswahili"],
    minRequirements: { "Biology": "C+", "Chemistry": "C+", "Mathematics": "C+", "Physics": "C+", "English": "C+", "Kiswahili": "C+" },
    programmes: ["Medicine & Surgery (MBChB)", "Nursing", "Pharmacy", "Dentistry", "Clinical Medicine"]
  },
  {
    id: "16",
    name: "Veterinary Medicine",
    subjects: ["Biology", "Chemistry", "Physics/Mathematics", "English/Kiswahili"],
    minRequirements: { "Biology": "C+", "Chemistry": "C+", "Mathematics": "C", "Physics": "C", "English": "C", "Kiswahili": "C" },
    programmes: ["Bachelor of Veterinary Medicine (BVM)"]
  },
  {
    id: "19",
    name: "Education",
    subjects: ["English/Kiswahili", "Mathematics/Teaching Subject", "Two Teaching Subjects", "Group II/III/IV/V"],
    minRequirements: { "English": "C+", "Kiswahili": "C+", "Mean Grade": "C+" },
    programmes: ["B.Ed Science", "B.Ed Arts", "B.Ed Special Needs", "B.Ed Early Childhood"]
  }
];

export const UNIVERSITY_DATA: UniversityStrength[] = [
  {
    name: "University of Nairobi (UoN)",
    departments: ["Medicine", "Law", "Engineering", "Architecture", "Economics", "Veterinary Medicine", "Journalism", "Pharmacy", "Computer Science", "Education"],
    rank: 1
  },
  {
    name: "Kenyatta University (KU)",
    departments: ["Education", "Health Sciences", "Environmental Studies", "Business", "Pure Sciences", "Fine Arts", "Nursing", "Sports Science"],
    rank: 2
  },
  {
    name: "JKUAT",
    departments: ["Engineering", "Computer Science", "IT", "Architecture", "Agriculture", "Food Science", "Pharmacy", "Veterinary Medicine"],
    rank: 3
  },
  {
    name: "Moi University",
    departments: ["Medicine", "Law", "Engineering", "Education", "Forest Resources", "Environmental Studies", "Nursing"],
    rank: 4
  },
  {
    name: "Strathmore University",
    departments: ["Business", "Finance", "Accounting", "IT", "Law", "Hospitality", "Actuarial Science"],
    rank: 1 // Private rank
  },
  {
    name: "USIU-Africa",
    departments: ["International Relations", "Psychology", "Pharmacy", "Business Administration", "Journalism", "Biochemistry"],
    rank: 2 // Private rank
  },
  {
    name: "Egerton University",
    departments: ["Agriculture", "Veterinary Medicine", "Food Science", "Education", "Engineering", "Health Sciences"],
    rank: 5
  },
  {
    name: "Maseno University",
    departments: ["Fisheries", "Education", "Health Sciences", "Agriculture", "Social Sciences"],
    rank: 6
  },
  {
    name: "Masinde Muliro University of Science & Technology",
    departments: ["Engineering", "Science", "Technology", "Education", "Computer Science"],
    rank: 7
  },
  {
    name: "Technical University of Kenya (TUK)",
    departments: ["Engineering", "Technology", "Applied Sciences", "Computer Science", "Architecture"],
    rank: 8
  },
  {
    name: "Technical University of Mombasa (TUM)",
    departments: ["Engineering", "Maritime Studies", "Technology", "Computer Science"],
    rank: 9
  },
  {
    name: "University of Eldoret",
    departments: ["Agriculture", "Engineering", "Education", "Environmental Studies"],
    rank: 10
  },
  {
    name: "Pwani University",
    departments: ["Agriculture", "Education", "Social Sciences", "Health Sciences"],
    rank: 11
  },
  {
    name: "Kisii University",
    departments: ["Education", "Health Sciences", "Agriculture", "Social Sciences"],
    rank: 12
  },
  {
    name: "Laikipia University",
    departments: ["Education", "Science", "Social Sciences", "Tourism"],
    rank: 13
  },
  {
    name: "South Eastern Kenya University (SEKU)",
    departments: ["Agriculture", "Education", "Water Resources", "Environmental Studies"],
    rank: 14
  },
  {
    name: "Multimedia University of Kenya",
    departments: ["Media", "Communication", "IT", "Engineering"],
    rank: 15
  },
  {
    name: "KCA University",
    departments: ["Business", "IT", "Accounting", "Finance", "Actuarial Science"],
    rank: 3 // Private rank
  },
  {
    name: "Daystar University",
    departments: ["Communication", "Business", "Social Sciences", "Journalism"],
    rank: 4 // Private rank
  },
  {
    name: "Mount Kenya University",
    departments: ["Pharmacy", "Nursing", "Business", "Education", "Health Sciences"],
    rank: 5 // Private rank
  }
];

export const CUTOFF_ESTIMATES = {
  VERY_HIGH: { range: "38-46", courses: ["Medicine", "Dentistry", "Architecture", "Pharmacy", "Law", "Nursing"] },
  HIGH: { range: "34-39", courses: ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Computer Science"] },
  MEDIUM: { range: "26-35", courses: ["Finance", "Accounting", "Education Science", "Journalism", "BCOM"] },
  LOW: { range: "20-27", courses: ["Agriculture", "Education Arts", "Social Work", "Environmental Science"] }
};
