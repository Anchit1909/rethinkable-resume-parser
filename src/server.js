const express = require("express");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { OpenAI } = require("openai");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");
const pdf = require("pdf-parse");
const cors = require("cors");

dotenv.config();

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_API || "");
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const db = {
  async createOrUpdateMember(telegramId, name, username) {
    return prisma.member.upsert({
      where: { telegramId },
      update: { name, username },
      create: { name, username, telegramId },
    });
  },

  async saveExperience(memberId, experience) {
    return prisma.experience.create({
      data: {
        title: experience.title,
        companyName: experience.company,
        location: experience.location || null,
        startDate: new Date(experience.startDate),
        endDate: experience.endDate ? new Date(experience.endDate) : null,
        isCurrent: !experience.endDate,
        description: experience.description,
        member: { connect: { id: memberId } },
      },
    });
  },

  async saveSkill(memberId, skillName, experienceId = null) {
    const skill = await prisma.skill.upsert({
      where: { name_memberId: { name: skillName, memberId } },
      update: {},
      create: { name: skillName, member: { connect: { id: memberId } } },
    });

    if (experienceId) {
      await prisma.experience.update({
        where: { id: experienceId },
        data: { skills: { connect: { id: skill.id } } },
      });
    }

    return skill;
  },

  async getMemberProfile(memberId) {
    return prisma.member.findUnique({
      where: { id: parseInt(memberId) },
      include: {
        experiences: {
          include: {
            skills: true,
          },
        },
        skills: true,
      },
    });
  },
};

async function parseResume(pdfText) {
  const prompt = `Extract the following information from this resume and provide the output in the exact JSON format:

  1. **Work experiences** (List of job experiences, with each having the fields: job_title, company_name, start_date, end_date, and description).
  2. **Skills** (Grouped into the following categories: programming_languages, technologies_frameworks, databases, devops, testing_development_tools).

  The JSON structure should strictly follow this format:

  {
    "work_experiences": [
      {
        "job_title": "Example Job Title",
        "company_name": "Example Company",
        "start_date": "Start Date",
        "end_date": "End Date or 'Present'",
        "description": "Example description"
      },
      ...
    ],
    "skills": [
        "Language 1",
        "Language 2",
        "Language 3",
        "Language 4"    
    ]
  }

  Resume content:
  ${pdfText}

  Ensure that all fields are present, even if the resume lacks information in some areas. If data is missing, leave the value as null, an empty list, or "Present" for the end date when appropriate. For skills, make sure to only keep one array with all the skills and dont divide it in subcategories. Also, start and end the response with {}. dont include anything else that may cause a problem in json parsing`;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  console.log(chatCompletion.choices[0].message.content);

  return JSON.parse(chatCompletion.choices[0].message.content);
}

bot.start(async (ctx) => {
  const from = ctx.update.message?.from;
  if (!from) return;
  try {
    await db.createOrUpdateMember(
      from.id.toString(),
      from.first_name,
      from.username || ""
    );
    await ctx.reply(`Welcome ${from.first_name}! Please upload your resume.`);
  } catch (error) {
    console.error("Error in start command:", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
});

bot.on(message("document"), async (ctx) => {
  const doc = ctx.message.document;
  if (!doc) return;

  try {
    const file = await ctx.telegram.getFile(doc.file_id);
    const fileLink = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_API}/${file.file_path}`;

    const response = await fetch(fileLink);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedPdf = await pdf(buffer);
    const resumeData = await parseResume(parsedPdf.text);

    const member = await db.createOrUpdateMember(
      ctx.from.id.toString(),
      ctx.from.first_name,
      ctx.from.username || ""
    );

    for (const exp of resumeData.work_experiences) {
      const experience = await db.saveExperience(member.id, {
        title: exp.job_title,
        company: exp.company_name,
        startDate: exp.start_date,
        endDate: exp.end_date === "Present" ? null : exp.end_date,
        description: exp.description,
      });
    }

    for (const skill of resumeData.skills) {
      await db.saveSkill(member.id, skill);
    }

    const profileLink = `${process.env.MINI_APP_URL}/profile/${member.id}`;

    await ctx.reply(
      `Your resume has been processed and saved. You can view your profile here: ${profileLink}`
    );
  } catch (error) {
    console.error("Error processing resume:", error);
    await ctx.reply(
      "An error occurred while processing your resume. Please try again."
    );
  }
});

app.get("/api/member/:memberId", async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const memberProfile = await db.getMemberProfile(memberId);
    if (!memberProfile) {
      return res.status(404).json({ error: "Member not found." });
    }
    res.json(memberProfile);
  } catch (error) {
    console.error("Error fetching member profile:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the member profile." });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
