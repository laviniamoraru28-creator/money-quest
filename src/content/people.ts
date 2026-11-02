export type Biography = { slug: string; name: string; title: string; topic: string; ages: string; image: string; alt: string; illustrationNote?: string; playful: string; sections: {heading: string; text: string}[]; takeaways: string[]; sourceTitle: string; source: string; checked: string };

/** Factual mini-biographies with clearly separated playful framing, not invented dialogue. */
export const libraryPeople: Biography[] = [
  {
    slug:"mark-zuckerberg-ideas-and-responsibility", name:"Mark Zuckerberg", title:"Mark Zuckerberg: ideas need responsibility",
    topic:"Technology, enterprise and digital responsibility", ages:"Builder and Strategist · ages 9–14; younger readers can share with a grown-up",
    image:"/images/money-quest/people/mark-zuckerberg.webp", alt:"Playful imagined cartoon portrait of Mark Zuckerberg beside a laptop and a leaning stack of idea cards.",
    playful:"Imagine a keyboard with a ‘make a successful business’ button. If only projects were that simple! This is a joke, not a story about something Mark said or did.",
    sections:[
      {heading:"A student and a website",text:"Mark Zuckerberg was a Harvard student when Facebook launched in 2004. The website began as a way for college students to connect. Building a service also involves other people’s ideas, work and decisions. One famous name is never the whole story of a technology."},
      {heading:"An idea is not the whole job",text:"A website needs more than a first version. People have to design it, run it and consider how it affects its users. A large audience makes those responsibilities important. Being well known or earning money does not make every decision automatically right."},
      {heading:"Your thinking challenge",text:"Imagine designing a class noticeboard without collecting names, photographs or private messages. How could people share useful ideas safely? You can discuss a design without making a social-media account. This profile is not an invitation to join Facebook."}
    ],
    takeaways:["Ask who helped build an idea.","Consider privacy when designing a product.","Judge decisions, not just fame or money."],
    sourceTitle:"Facebook and Think Computer Corporation Resolve Trademark Dispute, Meta, 2009",source:"https://about.fb.com/news/2009/05/facebook-and-think-computer-corporation-resolve-trademark-dispute/",checked:"2026-10-28"
  },
  {
    slug:"ada-lovelace-beyond-number-crunching",name:"Ada Lovelace",title:"Ada Lovelace: beyond number-crunching",
    topic:"Creativity, mathematics and computing",ages:"Explorer with a grown-up, Builder and Strategist · ages 6–14",
    image:"/images/money-quest/people/ada-lovelace.webp",alt:"Playful imagined cartoon portrait of Ada Lovelace considering a brass gear model and folded paper shapes.",
    playful:"Imagine asking a calculator to write a tune instead of a shopping total. That playful question helps introduce Ada’s much bigger idea. The picture is an imagined scene, not a record of her workshop.",
    sections:[
      {heading:"A curious mathematician",text:"Ada Lovelace was born in London in 1815. She studied mathematics and became interested in Charles Babbage’s proposed Analytical Engine. It was a mechanical machine design, not a laptop or a modern electronic computer."},
      {heading:"Notes that looked further",text:"In 1843, Ada translated an article about the engine and added extensive notes. She considered how such a machine might work with symbols and musical notes, beyond ordinary calculation. The complete engine was not built during her lifetime. Computing later developed through many people’s work."},
      {heading:"Your thinking challenge",text:"Invent a code where a circle means clap and a square means tap. Point to a sequence or draw it. A grown-up can perform it, or you can imagine the result. This is a modern activity inspired by symbolic instructions, not a reconstruction of Ada’s program."}
    ],
    takeaways:["Mathematics and imagination can work together.","An instruction can stand for an action.","Credit collaborators as well as famous names."],
    sourceTitle:"Ada Lovelace, Science Museum Group Collection",source:"https://collection.sciencemuseumgroup.org.uk/people/cp38764",checked:"2026-10-28"
  },
  {
    slug:"madam-cj-walker-a-business-and-a-network",name:"Madam C. J. Walker",title:"Madam C. J. Walker: a business and a network",
    topic:"Entrepreneurship, opportunity and community",ages:"Builder and Strategist · ages 9–14; shared reading is welcome",
    image:"/images/money-quest/people/madam-cj-walker.webp",alt:"Playful imagined cartoon portrait of Madam C. J. Walker with a notebook, product tins and an oversized hairbrush prop.",
    playful:"An enormous hairbrush makes a silly picture, but it cannot run a business. People, planning and useful products matter more. The oversized brush is our illustration joke, not a historical fact.",
    sections:[
      {heading:"Products for a community",text:"Madam C. J. Walker lived from 1867 to 1919. She developed and sold hair-care and beauty products for African-American women. Her business grew through product sales, advertising, mail orders and a network of trained sales representatives known as Walker Agents."},
      {heading:"A network, not a magic formula",text:"Walker established training facilities and moved her business headquarters to Indianapolis in 1910. Her work created opportunities for other women. Staff, agents and family members contributed to the enterprise. Her experience does not prove that hard work guarantees wealth or removes unfair barriers."},
      {heading:"Your thinking challenge",text:"Imagine a small supervised project that helps people solve a practical problem. What would you need to learn? Who would you ask? Draw a plan that includes training or support for the team, rather than promising that everyone will get rich."}
    ],
    takeaways:["Notice a real need before offering a product.","Training can help a team contribute.","Business stories involve social conditions and other people."],
    sourceTitle:"Two American Entrepreneurs: Madam C. J. Walker and J. C. Penney, US National Park Service",source:"https://www.nps.gov/articles/two-american-entrepreneurs-madam-c-j-walker-and-j-c-penney-teaching-with-historic-places.htm",checked:"2026-10-28"
  },
{
  "slug": "katherine-johnson-checking-the-numbers",
  "name": "Katherine Johnson",
  "title": "Katherine Johnson: checking the numbers",
  "topic": "Mathematics, teamwork and checking evidence",
  "ages": "Builder and Strategist · ages 9–14; shared reading is welcome",
  "image": "/images/money-quest/sections/brain-lab-v2.webp",
  "alt": "An illustrated Money Quest learning laboratory, used to introduce mathematics.",
  "illustrationNote": "Money Quest thematic illustration. It does not depict this person or a historical event.",
  "playful": "Imagine planning a journey without checking where it ends. What would you need to calculate before setting off?",
  "sections": [
    {
      "heading": "Mathematics for a journey",
      "text": "Katherine Johnson was born in 1918. She joined NACA, the organisation that preceded NASA, in 1953. Her work used mathematics to study flight. She later calculated the path for Alan Shepard’s 1961 space mission. A spacecraft needs a carefully planned route, not just a powerful engine."
    },
    {
      "heading": "Checking another method",
      "text": "Before John Glenn’s orbital flight in 1962, Johnson checked the computer’s calculations. She also worked on calculations for Apollo. Astronauts, engineers, mathematicians and many other people contributed. Her work took place amid racial and gender barriers. Those barriers were unfair, not a test people should have to pass."
    },
    {
      "heading": "Your thinking challenge",
      "text": "A pretend rover moves three squares forward and two more forward. Check its final position by counting, then by drawing. Do both methods agree? If they differ, inspect the steps. This small classroom activity is not spacecraft navigation."
    }
  ],
  "takeaways": [
    "Check a result using another method.",
    "Give credit to the whole team.",
    "Question barriers that exclude people."
  ],
  "sourceTitle": "Katherine Johnson Biography, NASA",
  "source": "https://www.nasa.gov/centers-and-facilities/langley/katherine-johnson-biography/",
  "checked": "2026-10-28"
},
{
  "slug": "mae-jemison-more-than-one-interest",
  "name": "Mae Jemison",
  "title": "Mae Jemison: more than one interest",
  "topic": "Science, medicine and exploration",
  "ages": "Builder and Strategist · ages 9–14; shared reading is welcome",
  "image": "/images/money-quest/sections/future-skills.webp",
  "alt": "A Money Quest future-skills illustration, introducing exploration and learning.",
  "illustrationNote": "Money Quest thematic illustration. It does not depict this person or a historical event.",
  "playful": "If you could pack a question for a space journey, which question would you take? No suitcase could hold every interesting question.",
  "sections": [
    {
      "heading": "A doctor and an astronaut",
      "text": "Mae Jemison studied engineering and medicine. She worked as a doctor, including as a Peace Corps medical officer in Sierra Leone and Liberia. NASA selected her for astronaut training in 1987. Her experience crossed several subjects rather than fitting into just one school topic."
    },
    {
      "heading": "Science in orbit",
      "text": "In September 1992, Jemison travelled aboard Endeavour on the STS-47 mission. She became the first African American woman in space. The mission included life-science and materials experiments. She worked with other crew members and teams on the ground. Space research depends on shared work and careful preparation."
    },
    {
      "heading": "Your thinking challenge",
      "text": "Choose two interests for a fictional explorer, such as drawing and studying plants. How might both help a team record a discovery? Draw a tool or describe a role. You do not need to choose a career now, and interests can change."
    }
  ],
  "takeaways": [
    "Different subjects can support one project.",
    "Preparation matters as well as a first step.",
    "A team needs different contributions."
  ],
  "sourceTitle": "Former Astronaut Mae C. Jemison, NASA",
  "source": "https://www.nasa.gov/former-astronaut-mae-c-jemison/",
  "checked": "2026-10-28"
},
{
  "slug": "tim-berners-lee-sharing-information",
  "name": "Tim Berners-Lee",
  "title": "Tim Berners-Lee: sharing information",
  "topic": "Invention, the web and digital responsibility",
  "ages": "Builder and Strategist · ages 9–14; shared reading is welcome",
  "image": "/images/money-quest/sections/future-skills.webp",
  "alt": "A Money Quest future-skills illustration, introducing connected information.",
  "illustrationNote": "Money Quest thematic illustration. It does not depict this person or a historical event.",
  "playful": "Imagine a library where each page could point you to another useful page. Which connections would help you find an answer?",
  "sections": [
    {
      "heading": "A problem at work",
      "text": "Tim Berners-Lee invented the World Wide Web at CERN in 1989. Scientists needed ways to share information across different computers and institutions. The web connected documents through links. It used existing networks; inventing the web was not the same as inventing the internet."
    },
    {
      "heading": "An idea others could build on",
      "text": "The first website explained the web project itself. In 1993 CERN made the web software available in the public domain. Other people could develop and use it. Many contributors helped the web grow. Being able to publish a page does not mean every claim on it is correct."
    },
    {
      "heading": "Your thinking challenge",
      "text": "Draw three paper pages about a pretend school garden. Add arrows showing useful links between them. Which page should explain where a fact came from? Keep names, passwords and private information out of your design. No online account is needed."
    }
  ],
  "takeaways": [
    "Begin by identifying a useful problem.",
    "Separate the web from the internet.",
    "Check sources even when a page looks convincing."
  ],
  "sourceTitle": "Where the web was born, CERN",
  "source": "https://home.cern/science/computing/the-birth-of-the-web/where-web-was-born/",
  "checked": "2026-10-28"
},
{
  "slug": "wangari-maathai-trees-and-community",
  "name": "Wangari Maathai",
  "title": "Wangari Maathai: trees and community",
  "topic": "Environment, leadership and working together",
  "ages": "Builder and Strategist · ages 9–14; shared reading is welcome",
  "image": "/images/money-quest/worlds/kindness-grove.webp",
  "alt": "A Money Quest garden illustration, introducing community and the environment.",
  "illustrationNote": "Money Quest thematic illustration. It does not depict this person or a historical event.",
  "playful": "A tree cannot fill in its own project plan. What might people need to organise to help a young tree grow?",
  "sections": [
    {
      "heading": "Listening to everyday needs",
      "text": "Wangari Maathai was a Kenyan scientist and environmental campaigner. In 1977 she started the Green Belt Movement. The movement encouraged women to plant trees and connected environmental work with people’s lives. It grew through the efforts of communities, not one person working alone."
    },
    {
      "heading": "Trees and rights",
      "text": "Maathai received the Nobel Peace Prize in 2004. The award recognised contributions to sustainable development, democracy and peace. Her work also concerned women’s rights. A tree-planting project needs suitable land, knowledge and continued care. Planting once is not the whole task."
    },
    {
      "heading": "Your thinking challenge",
      "text": "Plan a fictional garden with a grown-up adviser. What needs checking before planting: permission, suitable plants, water or paths? Choose two questions and show who could help answer them. You can draw a plan without collecting or planting anything."
    }
  ],
  "takeaways": [
    "Ask communities what they need.",
    "Plan care after a project begins.",
    "Share credit with those doing the work."
  ],
  "sourceTitle": "Wangari Maathai: Facts, NobelPrize.org",
  "source": "https://www.nobelprize.org/prizes/peace/2004/maathai/facts/",
  "checked": "2026-10-28"
},
{
  "slug": "louis-braille-designing-for-touch",
  "name": "Louis Braille",
  "title": "Louis Braille: designing for touch",
  "topic": "Accessible reading, design and inclusion",
  "ages": "Builder and Strategist · ages 9–14; shared reading is welcome",
  "image": "/images/money-quest/sections/inclusive-learning.webp",
  "alt": "A Money Quest inclusive-learning illustration, introducing different ways to read.",
  "illustrationNote": "Money Quest thematic illustration. It does not depict this person or a historical event.",
  "playful": "Could your fingers read a message? Raised patterns can carry information without needing printed letters to be seen.",
  "sections": [
    {
      "heading": "A reader improving a system",
      "text": "Louis Braille was a blind student in France. He learned about Charles Barbier’s raised-dot writing system and worked to simplify it. By 1824, at fifteen, he had developed a code using a six-dot cell. His design built on an earlier idea and addressed a real reading need."
    },
    {
      "heading": "Dots with meaning",
      "text": "A braille cell has two columns of three dot positions. Different raised patterns represent information. Braille also developed signs for music and mathematics. His system took time to gain official acceptance. Accessible reading is about access to information, not about judging someone’s intelligence."
    },
    {
      "heading": "Your thinking challenge",
      "text": "Draw six dot positions in two columns of three. Notice how changing a pattern changes what it could stand for. These invented patterns are not a braille lesson. Ask a grown-up to explore an RNIB learning resource if you want to learn the actual code. No blindfold is needed."
    }
  ],
  "takeaways": [
    "Include users in design decisions.",
    "An invention can improve earlier work.",
    "Different reading methods deserve equal respect."
  ],
  "sourceTitle": "Braille through the years, RNIB",
  "source": "https://www.rnib.org.uk/living-with-sight-loss/education-and-learning/braille-tactile-codes/braille-through-the-years-past-present-and-future/",
  "checked": "2026-10-28"
},
{
  "slug": "jane-goodall-looking-before-concluding",
  "name": "Jane Goodall",
  "title": "Jane Goodall: looking before concluding",
  "topic": "Observation, animals and evidence",
  "ages": "Builder and Strategist · ages 9–14; shared reading is welcome",
  "image": "/images/money-quest/sections/brain-lab.webp",
  "alt": "A Money Quest discovery illustration, introducing observation and questions.",
  "illustrationNote": "Money Quest thematic illustration. It does not depict this person or a historical event.",
  "playful": "If an animal could correct your notebook, would it cross out a guess? Looking carefully helps separate what happened from what we imagine.",
  "sections": [
    {
      "heading": "Observing at Gombe",
      "text": "Jane Goodall began studying wild chimpanzees at Gombe in what is now Tanzania in 1960. She watched their behaviour over time. That year she observed chimpanzees making and using tools to obtain termites. These observations challenged assumptions about the differences between humans and other animals."
    },
    {
      "heading": "Changing an explanation",
      "text": "Goodall’s research helped people reconsider what chimpanzees could do. Her later work included conservation and the Jane Goodall Institute. Long-term study involves many researchers and local contributors. One observation can raise a question, while repeated evidence helps us examine an explanation."
    },
    {
      "heading": "Your thinking challenge",
      "text": "Watch a bird from a safe distance, or use a nature picture. Record one thing you can actually observe. Then label a separate guess about why it happened. Do not approach, feed or disturb wildlife. You can complete the activity entirely with a picture."
    }
  ],
  "takeaways": [
    "Separate an observation from a guess.",
    "Change an explanation when evidence changes.",
    "Respect animals and local expertise."
  ],
  "sourceTitle": "JGI Timeline, Jane Goodall Institute",
  "source": "https://janegoodall.org/jgi-timeline/",
  "checked": "2026-10-28"
},
{
  "slug": "beatrix-potter-drawing-writing-and-making",
  "name": "Beatrix Potter",
  "title": "Beatrix Potter: drawing, writing and making",
  "topic": "Creativity, publishing and enterprise",
  "ages": "Builder and Strategist · ages 9–14; shared reading is welcome",
  "image": "/images/money-quest/sections/library.webp",
  "alt": "A Money Quest library illustration, introducing writing and creative work.",
  "illustrationNote": "Money Quest thematic illustration. It does not depict this person or a historical event.",
  "playful": "A rabbit cannot send a book to a printer. An author needs more than a story character to turn an idea into a published book.",
  "sections": [
    {
      "heading": "A story began in a letter",
      "text": "Beatrix Potter wrote and illustrated stories. A letter to a child called Noel included an adventure about Peter Rabbit. She later developed the story into a book. When publishers initially rejected it, she arranged a private printing in 1901."
    },
    {
      "heading": "From drawing to publication",
      "text": "Frederick Warne published a commercial colour edition of The Tale of Peter Rabbit in 1902. Potter took an active role in producing and promoting her work. She also studied and drew nature. Writing, illustration and practical publishing decisions all contributed; rejection alone does not predict whether a project will succeed."
    },
    {
      "heading": "Your thinking challenge",
      "text": "Invent your own animal character, rather than copying Peter Rabbit. Draw a cover and plan three scenes. Which job is writing, which is illustration, and which is organising the finished book? You can share the plan without buying materials or publishing it online."
    }
  ],
  "takeaways": [
    "Create your own characters and drawings.",
    "A finished book involves several jobs.",
    "Use feedback to reconsider a project."
  ],
  "sourceTitle": "The art of Beatrix Potter, National Trust",
  "source": "https://www.nationaltrust.org.uk/discover/history/art-collections/the-stories-behind-the-works-of-beatrix-potter",
  "checked": "2026-10-28"
}
];
export type LibraryPerson = typeof libraryPeople[number];
