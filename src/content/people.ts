/** Factual mini-biographies with clearly separated playful framing, not invented dialogue. */
export const libraryPeople = [
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
  }
];
export type LibraryPerson = typeof libraryPeople[number];
