export type Quiz={question:string;answers:[string,string,string];correct:number};
export type Room={slug:string;title:string;icon:string;intro:string;story:string;quiz:Quiz;explanation:string;activity:string};
export type Book={slug:string;title:string;icon:string;topic:string;pages:{title:string;text:string}[];quiz:Quiz};
export const museumRooms:Room[]=[
  {
    "slug": "before-money",
    "title": "Before Money",
    "icon": "🤝",
    "intro": "People have exchanged goods and services in many ways.",
    "story": "A farmer has apples. A baker has bread. They can swap if both agree. This is called barter. People have also used gifts, promises and credit. Money did not appear in one single way everywhere.",
    "quiz": {
      "question": "Why can swapping be difficult?",
      "answers": [
        "Both people must want the trade",
        "Everything has the same value",
        "Nobody needs anything"
      ],
      "correct": 0
    },
    "explanation": "Trade depends on finding someone who wants what you offer.",
    "activity": "Invent a fair trade with a friend."
  },
  {
    "slug": "first-coins",
    "title": "The First Coins",
    "icon": "🪙",
    "intro": "Stamped coins made many trades easier.",
    "story": "Some of the earliest stamped coins were made in Lydia, in today's Türkiye, more than 2,500 years ago. They included coins made from electrum, a mix of gold and silver. Coins developed in different places, and historians still study their beginnings.",
    "quiz": {
      "question": "What did a coin stamp help show?",
      "answers": [
        "The exact price of every item",
        "Who issued the coin",
        "How many people owned it"
      ],
      "correct": 1
    },
    "explanation": "People still needed to trust the coin.",
    "activity": "Design a coin with a meaningful symbol."
  },
  {
    "slug": "strange-money",
    "title": "Unusual Money",
    "icon": "🐚",
    "intro": "Money has taken many forms.",
    "story": "Shells, beads and stone discs have been used as money in different communities.",
    "quiz": {
      "question": "What matters most for something to work as money?",
      "answers": [
        "It must be gold",
        "It must be tiny",
        "People agree to accept it"
      ],
      "correct": 2
    },
    "explanation": "Shared trust and agreement are essential.",
    "activity": "Choose objects for a pretend town's currency."
  },
  {
    "slug": "money-through-time",
    "title": "Money Through Time",
    "icon": "⌛",
    "intro": "Payment methods change.",
    "story": "People have used coins, notes, accounts and electronic payments. Some older methods remain in use.",
    "quiz": {
      "question": "Which came earlier?",
      "answers": [
        "Coins",
        "Bank cards",
        "Mobile payments"
      ],
      "correct": 0
    },
    "explanation": "Coins are thousands of years older than payment cards.",
    "activity": "Ask an adult how they paid as a child."
  },
  {
    "slug": "banknote-lab",
    "title": "Banknote Lab",
    "icon": "💷",
    "intro": "Banknotes have security features.",
    "story": "Modern UK banknotes use polymer and features that help people recognise genuine notes.",
    "quiz": {
      "question": "Why do banknotes have security features?",
      "answers": [
        "To give every note the same colour",
        "To make copying harder",
        "To decide what shops charge"
      ],
      "correct": 1
    },
    "explanation": "Security features help protect against counterfeiting.",
    "activity": "Design a pretend banknote with your own pattern."
  },
  {
    "slug": "gold-vault",
    "title": "The Gold Vault",
    "icon": "🏅",
    "intro": "Money is not the same thing as gold.",
    "story": "Gold has been used for coins and jewellery. Modern UK pounds are not redeemable for a fixed quantity of gold.",
    "quiz": {
      "question": "Is a pound coin pure gold?",
      "answers": [
        "Yes, its colour proves it",
        "Only older pound coins are pure gold",
        "No"
      ],
      "correct": 2
    },
    "explanation": "Money works because people accept it in payment.",
    "activity": "Compare a pretend coin with a real coin."
  },
  {
    "slug": "around-the-world",
    "title": "Money Around the World",
    "icon": "🌍",
    "intro": "Different places use different currencies.",
    "story": "The UK uses pounds sterling, Japan uses yen, and many European countries use euros.",
    "quiz": {
      "question": "Which currency does Japan use?",
      "answers": [
        "Yen",
        "Pounds",
        "Euros"
      ],
      "correct": 0
    },
    "explanation": "Exchange rates between currencies change.",
    "activity": "Find currencies on a map."
  },
  {
    "slug": "business-invention",
    "title": "Business and Invention",
    "icon": "💡",
    "intro": "Ideas can solve real problems.",
    "story": "Entrepreneurs can test a small idea and ask people whether it helps them.",
    "quiz": {
      "question": "What should you do before making 100 products?",
      "answers": [
        "Ignore feedback",
        "Test a small idea",
        "Buy 100 boxes"
      ],
      "correct": 1
    },
    "explanation": "Testing early can save time and money.",
    "activity": "Invent something helpful for your home."
  },
  {
    "slug": "museum-of-mistakes",
    "title": "Museum of Mistakes",
    "icon": "🔧",
    "intro": "Feedback helps people improve.",
    "story": "In 1985 Coca-Cola changed its cola recipe in the United States. After complaints, the company brought back the original formula.",
    "quiz": {
      "question": "What can businesses learn from feedback?",
      "answers": [
        "Hide mistakes",
        "Never change",
        "Listen and improve"
      ],
      "correct": 2
    },
    "explanation": "Learning means noticing what happened and adapting.",
    "activity": "Describe something you improved after a mistake."
  },
  {
    "slug": "future-money",
    "title": "Future Money Lab",
    "icon": "📱",
    "intro": "Digital payments still use real money.",
    "story": "Cards and phones can send instructions to transfer money or charge an account. The card itself is not the account balance.",
    "quiz": {
      "question": "Does tapping a card create free money?",
      "answers": [
        "No",
        "Yes, the terminal adds money",
        "Yes, if it is a phone payment"
      ],
      "correct": 0
    },
    "explanation": "Check the amount before paying.",
    "activity": "Make a pretend card payment and record it in a budget."
  }
];
export const libraryBooks:Book[]=[
  {
    "slug": "the-saving-seed",
    "title": "The Saving Seed",
    "icon": "🌱",
    "topic": "Saving and patience",
    "pages": [
      {
        "title": "A Small Wish",
        "text": "Mia sees a kite in a shop. It costs eight one-pound coins. She has three. She wants to buy it today, but counts again and sees that she needs five more. She decides to make a plan."
      },
      {
        "title": "A Simple Plan",
        "text": "Mia draws eight circles on a piece of paper. She colours three for the money she already has. When she can save another pound, she colours one more circle. Some weeks she saves nothing. She can still return to her plan."
      },
      {
        "title": "The Windy Day",
        "text": "After saving five more pounds, Mia has eight. She checks the price with her grown-up before buying the kite. At the park, she watches it rise. Her picture helped her see a big goal as a set of smaller steps."
      }
    ],
    "quiz": {
      "question": "What helped Mia reach her goal?",
      "answers": [
        "Saving little by little",
        "Buying sweets daily",
        "Forgetting the price"
      ],
      "correct": 0
    }
  },
  {
    "slug": "the-want-monster",
    "title": "The Want Monster",
    "icon": "🧡",
    "topic": "Needs, wants and self-control",
    "pages": [
      {
        "title": "Look at That!",
        "text": "Theo sees a shiny robot in a toy shop. A bright sign makes it look exciting. He imagines taking it home right now. Wanting it feels strong, but he remembers that a feeling does not have to decide what he buys."
      },
      {
        "title": "The Pause",
        "text": "Theo pauses. He asks what the robot costs and checks the money he has saved. Then he remembers his bicycle goal. Buying the robot would leave less for the bicycle. He can enjoy looking at something without buying it."
      },
      {
        "title": "My Choice",
        "text": "Theo decides to wait until tomorrow before choosing. He tells his grown-up about both options. He may still choose the robot later, or keep saving for the bicycle. The useful skill is taking time to make his own informed choice."
      }
    ],
    "quiz": {
      "question": "What helps when you really want something?",
      "answers": [
        "Buy immediately",
        "Pause and think",
        "Let an advert decide"
      ],
      "correct": 1
    }
  },
  {
    "slug": "the-lemonade-test",
    "title": "The Lemonade Test",
    "icon": "🍋",
    "topic": "Entrepreneurship and feedback",
    "pages": [
      {
        "title": "A First Idea",
        "text": "Ruby plans a pretend lemonade stall with her grown-up. She makes a sign, but few people stop. She feels disappointed. Instead of buying more supplies straight away, she decides to find out what people notice."
      },
      {
        "title": "A Better Question",
        "text": "Ruby asks trusted visitors what would help them decide. With her grown-up, she offers a small sample and makes the sign clearer. She changes one thing at a time so she can notice what happens. More people stop to ask about the drink."
      },
      {
        "title": "Try Again",
        "text": "Ruby records the money received and the cost of ingredients and cups. Samples cost money too. She works out whether sales covered those costs before calling the result a profit. Her first idea gave her information for a better next test."
      }
    ],
    "quiz": {
      "question": "What did Ruby do when her plan failed?",
      "answers": [
        "Gave up",
        "Ignored customers",
        "Asked and tested an idea"
      ],
      "correct": 2
    }
  },
  {
    "slug": "the-team-bridge",
    "title": "The Team Bridge",
    "icon": "🌉",
    "topic": "Leadership and teamwork",
    "pages": [
      {
        "title": "The Challenge",
        "text": "Four friends have a box of blocks and a challenge: make a bridge that holds a small toy. They all reach for the blocks at once. Ava notices that some ideas are not getting heard. She suggests a short pause."
      },
      {
        "title": "Listening First",
        "text": "Ava asks each friend to share an idea. One friend points to a drawing instead of speaking. They agree on a wide base, a strong middle and jobs that everyone wants to try. When the middle falls, they look at it together."
      },
      {
        "title": "Stronger Together",
        "text": "The team adds another support and tests the bridge again. It holds the toy. Ava thanks everyone for their ideas and work. She helped the group organise, but the result came from listening, testing and sharing the task."
      }
    ],
    "quiz": {
      "question": "How did Ava lead?",
      "answers": [
        "She listened",
        "She ignored everyone",
        "She worked alone"
      ],
      "correct": 0
    }
  },
  {
    "slug": "the-brave-mistake",
    "title": "The Brave Mistake",
    "icon": "🛠️",
    "topic": "Learning from mistakes",
    "pages": [
      {
        "title": "Oops!",
        "text": "Noah folds a paper aeroplane with a grown-up. It drops almost straight down on the first flight. Noah feels frustrated and puts it on the table for a moment. A short break helps him look again."
      },
      {
        "title": "Look Closely",
        "text": "Noah notices that one wing is bent down. He straightens it and keeps the other parts the same. He launches from the same place. Changing one thing makes it easier to notice what might have helped."
      },
      {
        "title": "A New Flight",
        "text": "The aeroplane glides farther on the next flight. Noah tries it a few more times and records the results. Not every flight is the same. He has useful information for another test, rather than proof that one design always works."
      }
    ],
    "quiz": {
      "question": "What helped Noah improve?",
      "answers": [
        "Blaming a friend",
        "Noticing and trying again",
        "Hiding the aeroplane"
      ],
      "correct": 1
    }
  },
  {
    "slug": "the-digital-coin",
    "title": "The Digital Coin",
    "icon": "💳",
    "topic": "Digital money and safety",
    "pages": [
      {
        "title": "Where Is the Money?",
        "text": "Leah watches her parent tap a card at a shop. No coins change hands. She asks where the money went. Her parent explains that money can be recorded electronically in a bank account as well as held as cash."
      },
      {
        "title": "Behind the Tap",
        "text": "A debit card can give instructions to take money from an account. A credit card uses borrowed money that must be repaid. A phone wallet can be another way to send a payment instruction. The plastic card and phone are tools, not the money itself."
      },
      {
        "title": "Check Before You Tap",
        "text": "Leah and her parent check the amount before paying. Afterwards they compare the receipt with the payment record. Spending digitally still affects real money or borrowing. A quick tap is a reason to keep checking, not a way to get things free."
      }
    ],
    "quiz": {
      "question": "What should you check before paying?",
      "answers": [
        "Card colour",
        "The weather",
        "The amount"
      ],
      "correct": 2
    }
  },
  {
    "slug": "ada-and-the-machine",
    "title": "Ada and the Machine",
    "icon": "🧮",
    "topic": "Biography: Ada Lovelace",
    "pages": [
      {
        "title": "A Curious Thinker",
        "text": "Ada Lovelace was born in London in 1815. She studied mathematics and became interested in Charles Babbage's proposed Analytical Engine. The machine was a plan for a programmable mechanical calculator. It was not a modern electronic computer."
      },
      {
        "title": "An Amazing Idea",
        "text": "In 1843 Ada translated an article about the proposed engine and added extensive notes. Her notes included a method involving Bernoulli numbers. The complete Analytical Engine was not built in her lifetime, so these ideas were not the same as running a program on a finished machine."
      },
      {
        "title": "Beyond Numbers",
        "text": "Ada considered how symbols could stand for more than ordinary numbers. She imagined possibilities involving music. Her work shows how mathematical knowledge and imagination can help someone ask new questions about a technology. Later computing developed through many people's contributions."
      }
    ],
    "quiz": {
      "question": "What made Ada's ideas special?",
      "answers": [
        "She imagined new uses for machines",
        "She built a smartphone",
        "She invented laptops"
      ],
      "correct": 0
    }
  },
  {
    "slug": "george-and-the-invention",
    "title": "George and the Invention",
    "icon": "🚂",
    "topic": "Biography: George Stephenson",
    "pages": [
      {
        "title": "Learning by Doing",
        "text": "George Stephenson was born in Northumberland in 1781. He learned engineering through practical work and helped develop early railways and locomotives. He worked in a world where many people were testing ways to move goods and passengers."
      },
      {
        "title": "A Railway Idea",
        "text": "In 1829 the Rainhill Trials compared locomotives for the Liverpool and Manchester Railway. Rocket, designed by Robert Stephenson and built by his company, won. George was Robert's father and an important railway engineer. The achievement involved a team and earlier ideas."
      },
      {
        "title": "Building on Ideas",
        "text": "Rocket brought several useful engineering developments together. It was changed again as technology advanced. Railway history is not the story of one person inventing everything at once. Engineers learn from tests, other people's work and the needs of the people using a system."
      }
    ],
    "quiz": {
      "question": "What helped railway technology improve?",
      "answers": [
        "Magic",
        "Testing and engineering",
        "Never changing designs"
      ],
      "correct": 1
    }
  }
];
