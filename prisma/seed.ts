import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create two recruiters
  const recruiter1 = await prisma.recruiter.upsert({
    where: { email: "hr@colorado.edu" },
    update: {},
    create: {
      email: "hr@colorado.edu",
      name: "Student Employment",
      department: "Enrollment Management",
    },
  });

  const recruiter2 = await prisma.recruiter.upsert({
    where: { email: "cs-dept@colorado.edu" },
    update: {},
    create: {
      email: "cs-dept@colorado.edu",
      name: "CS Department",
      department: "Computer Science",
    },
  });

  // 2. Create 10 jobs (upsert by title+recruiterId)
  const jobsData = [
    {
      title: "Library Assistant",
      department: "University Libraries",
      hoursPerWeek: 15,
      payRange: "$15-17/hr",
      workStudyEligible: true,
      contactName: "Jane Smith",
      contactEmail: "jane.smith@colorado.edu",
      contactPhone: "303-555-0101",
      additionalContactInfo: "Norlin Library Room 101",
      recruiterId: recruiter1.id,
      description:
        "Assist with shelving, circulation, and front desk operations at Norlin Library. Ideal for students who enjoy organization and helping patrons find resources.",
    },
    {
      title: "Dining Services Team Member",
      department: "Housing & Dining",
      hoursPerWeek: 15,
      payRange: "$15/hr",
      workStudyEligible: true,
      contactName: "Mike Johnson",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Join our dining team to help prepare and serve meals across campus dining halls. Flexible scheduling available for students.",
    },
    {
      title: "Teaching Assistant - CS 101",
      department: "Computer Science",
      hoursPerWeek: 12,
      payRange: "$18-20/hr",
      workStudyEligible: false,
      contactName: "Dr. Sarah Chen",
      contactEmail: "sarah.chen@colorado.edu",
      contactPhone: "303-555-0201",
      additionalContactInfo: "ECOT 312, Office hours Tue/Thu 2-4pm",
      recruiterId: recruiter2.id,
      description:
        "Support CS 101 instruction by leading discussion sections, grading assignments, and holding office hours. Strong programming and communication skills required.",
    },
    {
      title: "IT Help Desk Assistant",
      department: "OIT",
      hoursPerWeek: 15,
      payRange: "$16-18/hr",
      workStudyEligible: true,
      contactName: "Alex Rivera",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Provide technical support to students and staff. Assist with password resets, software issues, and basic troubleshooting.",
    },
    {
      title: "Front Desk Assistant",
      department: "Recreation Services",
      hoursPerWeek: 10,
      payRange: "$15/hr",
      workStudyEligible: true,
      contactName: "Jordan Lee",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Greet visitors, process memberships, and answer questions at the recreation center front desk.",
    },
    {
      title: "Recreation Center Assistant",
      department: "Recreation Services",
      hoursPerWeek: 12,
      payRange: "$15-16/hr",
      workStudyEligible: true,
      contactName: "Jordan Lee",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Support recreation center operations including equipment checkout, facility monitoring, and customer service.",
    },
    {
      title: "Research Assistant - Lab",
      department: "Biology",
      hoursPerWeek: 12,
      payRange: "$16/hr",
      workStudyEligible: true,
      contactName: "Dr. Emily Park",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Assist with lab research including data entry, sample preparation, and maintaining lab equipment. Lab safety training provided.",
    },
    {
      title: "Tutoring Center Peer Tutor",
      department: "Student Academic Success",
      hoursPerWeek: 8,
      payRange: "$16/hr",
      workStudyEligible: true,
      contactName: "Maria Garcia",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Tutor fellow students in various subjects. Strong communication and subject matter expertise required.",
    },
    {
      title: "Campus Tour Guide",
      department: "Admissions",
      hoursPerWeek: 6,
      payRange: "$15/hr",
      workStudyEligible: false,
      contactName: "Tom Wilson",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Lead campus tours for prospective students and families. Enthusiasm for CU Boulder and strong public speaking skills required.",
    },
    {
      title: "Admin Assistant",
      department: "College of Engineering",
      hoursPerWeek: 12,
      payRange: "$15-16/hr",
      workStudyEligible: true,
      contactName: "Lisa Brown",
      contactEmail: "",
      contactPhone: "",
      additionalContactInfo: "",
      recruiterId: recruiter1.id,
      description:
        "Provide administrative support to the College of Engineering. Duties include filing, data entry, and front desk coverage.",
    },
  ];

  const jobs: { id: string; title: string }[] = [];
  for (const data of jobsData) {
    const existing = await prisma.job.findFirst({
      where: { title: data.title, recruiterId: data.recruiterId },
    });
    if (existing) {
      jobs.push({ id: existing.id, title: existing.title });
    } else {
      const job = await prisma.job.create({ data });
      jobs.push({ id: job.id, title: job.title });
    }
  }

  // 3. Create ParsedJob for each job
  const taJobIndex = 2; // 0-based: Teaching Assistant - CS 101
  const itJobIndex = 3; // 0-based: IT Help Desk Assistant

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const jobRecord = await prisma.job.findUnique({
      where: { id: job.id },
      include: { parsedJob: true },
    });
    if (!jobRecord || jobRecord.parsedJob) continue;

    let requiredSkills: string[];
    if (i === taJobIndex) {
      requiredSkills = ["Python", "Java", "Communication", "Teaching"];
    } else if (i === itJobIndex) {
      requiredSkills = ["Technical support", "Troubleshooting", "Customer service"];
    } else {
      requiredSkills = ["Customer service", "Reliability"];
    }

    const jobData = jobsData[i];
    const eligibilityRequirements = jobData.workStudyEligible
      ? ["Work-study eligible"]
      : [];
    const availabilityRequirements = [`${jobData.hoursPerWeek} hours/week`];

    await prisma.parsedJob.create({
      data: {
        jobId: job.id,
        requiredSkillsJson: JSON.stringify(requiredSkills),
        preferredSkillsJson: JSON.stringify(["Detail-oriented"]),
        requiredExperienceJson: JSON.stringify([]),
        eligibilityRequirementsJson: JSON.stringify(eligibilityRequirements),
        availabilityRequirementsJson: JSON.stringify(availabilityRequirements),
      },
    });
  }

  // 4. Create three students (upsert by email)
  const student1 = await prisma.student.upsert({
    where: { email: "student1@colorado.edu" },
    update: {},
    create: {
      email: "student1@colorado.edu",
      name: "Alex Morgan",
    },
  });

  const student2 = await prisma.student.upsert({
    where: { email: "student2@colorado.edu" },
    update: {},
    create: {
      email: "student2@colorado.edu",
      name: "Jordan Taylor",
    },
  });

  const student3 = await prisma.student.upsert({
    where: { email: "student3@colorado.edu" },
    update: {},
    create: {
      email: "student3@colorado.edu",
      name: "Casey Kim",
    },
  });

  // 5. ParsedResume for each (only if student has no resume yet)
  const alexResume = {
    rawText:
      "Alex Morgan, BS Computer Science, CU Boulder 2026. Skills: Python, Java, Customer service, Microsoft Office. Experience: Library Volunteer at Public Library (1 year) - Shelving, Front desk. Availability: 15 hours/week. Eligibility: work-study.",
    skillsJson: JSON.stringify([
      "Python",
      "Java",
      "Customer service",
      "Microsoft Office",
    ]),
    experienceJson: JSON.stringify([
      {
        title: "Library Volunteer",
        company: "Public Library",
        duration: "1 year",
        bullets: ["Shelving", "Front desk"],
      },
    ]),
    educationJson: JSON.stringify([
      {
        degree: "BS Computer Science",
        institution: "CU Boulder",
        year: "2026",
      },
    ]),
    availability: "15 hours/week",
    eligibility: "work_study",
    atsReadabilityScore: 78,
  };

  const jordanResume = {
    rawText:
      "Jordan Taylor, BS Biology, CU Boulder 2025. Skills: Data entry, Lab safety, Excel, Communication. Experience: Lab Assistant. Availability: 12 hours/week. Eligibility: work-study.",
    skillsJson: JSON.stringify([
      "Data entry",
      "Lab safety",
      "Excel",
      "Communication",
    ]),
    experienceJson: JSON.stringify([
      {
        title: "Lab Assistant",
        company: "Biology Dept",
        duration: "6 months",
        bullets: ["Data entry", "Sample preparation", "Lab maintenance"],
      },
    ]),
    educationJson: JSON.stringify([
      {
        degree: "BS Biology",
        institution: "CU Boulder",
        year: "2025",
      },
    ]),
    availability: "12 hours/week",
    eligibility: "work_study",
    atsReadabilityScore: 72,
  };

  const caseyResume = {
    rawText:
      "Casey Kim, BA English, CU Boulder 2025. Skills: Writing, Tutoring, Communication, Editing. Experience: Writing Tutor. Availability: 10 hours/week. Eligibility: hourly.",
    skillsJson: JSON.stringify([
      "Writing",
      "Tutoring",
      "Communication",
      "Editing",
    ]),
    experienceJson: JSON.stringify([
      {
        title: "Writing Tutor",
        company: "Writing Center",
        duration: "1 year",
        bullets: ["One-on-one tutoring", "Essay feedback", "Grammar assistance"],
      },
    ]),
    educationJson: JSON.stringify([
      {
        degree: "BA English",
        institution: "CU Boulder",
        year: "2025",
      },
    ]),
    availability: "10 hours/week",
    eligibility: "hourly",
    atsReadabilityScore: 80,
  };

  const alexHasResume = await prisma.parsedResume.findFirst({
    where: { studentId: student1.id },
  });
  if (!alexHasResume) {
    await prisma.parsedResume.create({
      data: { ...alexResume, studentId: student1.id },
    });
  }

  const jordanHasResume = await prisma.parsedResume.findFirst({
    where: { studentId: student2.id },
  });
  if (!jordanHasResume) {
    await prisma.parsedResume.create({
      data: { ...jordanResume, studentId: student2.id },
    });
  }

  const caseyHasResume = await prisma.parsedResume.findFirst({
    where: { studentId: student3.id },
  });
  if (!caseyHasResume) {
    await prisma.parsedResume.create({
      data: { ...caseyResume, studentId: student3.id },
    });
  }

  // 6. Sample applications
  const libraryJobId = jobs[0].id;
  const taJobId = jobs[2].id;
  const diningJobId = jobs[1].id;

  // Alternate job IDs for TA rejection (3 other job IDs, excluding TA)
  const alternateJobIds = [jobs[0].id, jobs[3].id, jobs[4].id].filter(
    (id) => id !== taJobId
  );

  // Alex applied to TA job
  let alexTaApp = await prisma.application.findFirst({
    where: { studentId: student1.id, jobId: taJobId },
  });
  if (!alexTaApp) {
    alexTaApp = await prisma.application.create({
      data: {
        studentId: student1.id,
        jobId: taJobId,
        status: "screened_out",
        trackerStatus: "applied",
      },
    });

    await prisma.matchResult.create({
      data: {
        applicationId: alexTaApp.id,
        overallScore: 48,
        eligibilityScore: 60,
        requiredSkillsScore: 72,
        experienceScore: 45,
        availabilityScore: 85,
        preferredSkillsScore: 55,
        atsReadabilityScore: 78,
        strengthsJson: JSON.stringify(["Strong alignment with required skills"]),
        gapsJson: JSON.stringify([
          "Teaching or TA experience not clearly shown",
          "Add relevant coursework or tutoring experience",
        ]),
        fitReasonsJson: JSON.stringify(["You have several preferred skills"]),
        metHardFilters: true,
      },
    });

    await prisma.rejectionFeedback.create({
      data: {
        applicationId: alexTaApp.id,
        unmetRequirementsJson: JSON.stringify([]),
        resumeGapsJson: JSON.stringify([
          "Teaching or TA experience not clearly shown",
        ]),
        improvementSuggestionsJson: JSON.stringify([
          "Add any tutoring or teaching experience",
          "Highlight CS 101 grade if A",
          "Mention office hours or leadership roles",
        ]),
        alternateJobIdsJson: JSON.stringify(alternateJobIds),
        plainEnglishSummary:
          "Your technical skills are a good fit, but the role emphasizes teaching experience. Consider adding tutoring or TA experience to strengthen your application.",
      },
    });
  }

  // Alex applied to Library job
  let alexLibApp = await prisma.application.findFirst({
    where: { studentId: student1.id, jobId: libraryJobId },
  });
  if (!alexLibApp) {
    alexLibApp = await prisma.application.create({
      data: {
        studentId: student1.id,
        jobId: libraryJobId,
        status: "screened_in",
        trackerStatus: "under_review",
      },
    });

    await prisma.matchResult.create({
      data: {
        applicationId: alexLibApp.id,
        overallScore: 82,
        eligibilityScore: 90,
        requiredSkillsScore: 88,
        experienceScore: 85,
        availabilityScore: 90,
        preferredSkillsScore: 80,
        atsReadabilityScore: 78,
        strengthsJson: JSON.stringify([
          "Strong alignment with required skills",
          "Relevant experience highlighted",
          "Eligibility criteria appear to be met",
        ]),
        gapsJson: JSON.stringify([]),
        fitReasonsJson: JSON.stringify([]),
        metHardFilters: true,
      },
    });
  }

  // Jordan applied to Dining
  const jordanDiningApp = await prisma.application.findFirst({
    where: { studentId: student2.id, jobId: diningJobId },
  });
  if (!jordanDiningApp) {
    await prisma.application.create({
      data: {
        studentId: student2.id,
        jobId: diningJobId,
        status: "screened_in",
        trackerStatus: "applied",
      },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
