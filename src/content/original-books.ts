export type BookChapter = {
  title: string;
  paragraphs: string[];
  idea: string;
  question: string;
  choices: { text: string; feedback: string; correct: boolean }[];
  activity: string;
};

export type OriginalBook = {
  slug: string; title: string; subtitle: string; audience: string; description: string;
  cover: string; coverAlt: string; chapters: BookChapter[];
  glossary: { term: string; meaning: string }[];
};

/** Original Money Quest fiction. Prices are invented examples, not shopping advice. */
export const firstMoneyBook = {
  slug: "the-little-compass-and-the-money-choices",
  title: "The Little Compass and the Money Choices",
  subtitle: "A Coin Cove story about spending, saving and caring",
  audience: "Explorer · ages 6–8 · Read independently or with a grown-up",
  description: "Join our girl guide and her puppy for eight chapters about a model boat, a tempting market and a plan that can change.",
  cover: "/images/money-quest/books/little-compass-cover.webp",
  coverAlt: "Our girl guide and her brown-and-white puppy consider a wooden model boat at a sunny Coin Cove market stall.",
  chapters: [
    {
      title: "A boat in the window",
      paragraphs: [
        "Emma and her puppy, Max, stop at a shop. They see a little wooden boat. It has a purple sail.",
        "‘I would like that boat,’ says Emma. ‘It costs six pounds,’ says the shopkeeper. Emma opens her small purse.",
        "At home, a grown-up helps her count. Emma has four one-pound coins. The boat costs six pounds. She needs two more pounds.",
        "Emma feels disappointed. She draws the boat. ‘I can wait, choose another toy, or keep my money,’ she says. She does not need to rush."
],
      idea: "A price tells us how much something costs. Wanting something does not mean we must buy it now.",
      question: "The boat costs £6. The girl has £4. What could she do?",
      choices: [
        { text: "Take the boat without paying", feedback: "The stallholder must agree to a sale. She can leave the boat and make a plan instead.", correct: false },
        { text: "Wait and make a plan", feedback: "Yes. Waiting gives her time to think. She can also choose a different goal.", correct: true },
        { text: "Pretend four pounds is six pounds", feedback: "Changing the words does not change the amount. She has £4 and needs £2 more for this boat.", correct: false }
      ],
      activity: "Draw something a fictional character would like. You can also point to an object. Decide whether the character would buy now, wait or choose something else."
    },
    {
      title: "Money and ways to pay",
      paragraphs: [
        "Emma goes to the bakery with her grown-up. They need bread for lunch. One person pays with coins. Another taps a card.",
        "‘Does the card make money?’ asks Emma. ‘No,’ says her grown-up. ‘My debit card helps me pay with money in my bank account.’",
        "Coins and notes are cash. An account is a record of money at a bank. A card or phone can help someone pay. It is a tool.",
        "‘Tapping is still spending,’ says the grown-up. They check the price before paying. Max sniffs the shopping bag. He seems more interested in the bread!"
],
      idea: "Coins and notes are cash. A debit card or payment phone helps us use account money. A credit card involves borrowing that must be repaid.",
      question: "What happens when a grown-up pays with a debit card?",
      choices: [
        { text: "The card makes new money", feedback: "A card does not make money. It is a tool used to arrange a payment.", correct: false },
        { text: "The shopping becomes free", feedback: "The price still needs to be paid, even when no coins change hands.", correct: false },
        { text: "Money is paid from their account", feedback: "Yes. The debit card helps pay from an account. The amount still matters.", correct: true }
      ],
      activity: "Find the coin, banknote, card and phone pictures in Coin Cove. Point to cash, then point to a payment tool. Use pictures rather than real cards or account details."
    },
    {
      title: "The list before the market",
      paragraphs: [
        "Before shopping, Emma helps make a list. They need bread, vegetables and soap today. Max waits by the door. He would like a walk.",
        "‘We plan for things we need first,’ says the grown-up. Food helps the family eat. Soap helps them wash. The model boat can wait.",
        "Emma sees an umbrella. ‘Is that a need?’ she asks. ‘It depends,’ says her grown-up. ‘Someone may need it to keep dry.’",
        "Emma puts the boat on her ‘can wait’ list. She still likes it. Wanting a toy is all right. When they get home, Max gets his walk."
],
      idea: "Needs help us live and stay well. Wants can bring enjoyment. What someone needs depends on their situation.",
      question: "In this story, what belongs first on the household shopping list?",
      choices: [
        { text: "Food needed for lunch", feedback: "Yes. The household needs food today. The model boat can wait.", correct: true },
        { text: "Every toy in the market", feedback: "Toys can be enjoyable, but buying every toy would leave less money for the household’s needs.", correct: false },
        { text: "Only things with bright packaging", feedback: "Packaging can catch our attention. It does not tell us what the household needs.", correct: false }
      ],
      activity: "Use invented picture cards for a character on a rainy day. Which things are important today? Which could wait? You do not need to discuss your own household’s money."
    },
    {
      title: "The shiny spinning top",
      paragraphs: [
        "At the market, a green spinning top catches Emma’s eye. Round and round it goes. ‘It costs two pounds,’ says the shopkeeper.",
        "Emma has four pounds. If she buys the top for two pounds, two pounds will be left. The boat will still cost six pounds.",
        "‘I like both,’ says Emma. ‘You can choose what matters today,’ says her grown-up. ‘You cannot spend the same money twice.’",
        "They sit on a bench with Max. Emma takes time to think. ‘Today I will keep saving for the boat,’ she says. She can choose again later."
],
      idea: "Money spent on one thing is no longer available for another. A pause can help us choose.",
      question: "She has £4 and spends £2 on the top. How much remains?",
      choices: [
        { text: "£6", feedback: "Spending reduces the money she has. Try moving two counters away from a group of four.", correct: false },
        { text: "£2", feedback: "Yes. Four pounds minus two pounds leaves two pounds. She can compare that choice with her goal.", correct: true },
        { text: "£4", feedback: "She started with £4, but £2 would go to the stallholder. Count what is left.", correct: false }
      ],
      activity: "Use four counters as pretend pounds. Move two to a pretend shop. Count what remains. You can point, draw or use a communication tool."
    },
    {
      title: "A plan with room to change",
      paragraphs: [
        "Emma draws six circles in her notebook. Each circle stands for one pound. She colours four circles for the four pounds she has.",
        "Two circles are empty. If another pound becomes available to save, she can colour one more. Then she would need one more pound.",
        "‘We do not know when more money will be available,’ says her grown-up. Not every family gives pocket money. A plan can change.",
        "While she waits, Emma makes a paper boat. Max watches from his blanket. A paper boat is fun too. She can enjoy something without buying it."
],
      idea: "A saving goal has a target and a starting amount. Plans can change. Having money to save is not always possible.",
      question: "The target is £6 and she has £4. How much more is needed?",
      choices: [
        { text: "£10", feedback: "Adding the target and the starting amount gives ten, but we need the gap between them.", correct: false },
        { text: "£1", feedback: "One more pound would make five. The boat costs six. Try counting on once more.", correct: false },
        { text: "£2", feedback: "Yes. Four plus two makes six. The timing depends on whether more money becomes available.", correct: true }
      ],
      activity: "Draw six circles for the fictional boat goal. Colour four. Count the two empty circles. No real money or personal information is needed."
    },
    {
      title: "The sign that said hurry",
      paragraphs: [
        "A bright toy poster says ‘Hurry!’ Emma feels excited. The ship in the picture looks huge. She reaches for her purse, then stops.",
        "‘An advert tries to make us want to buy,’ says her grown-up. ‘We can check the price and what is in the box.’",
        "The real toy is smaller than the picture. Emma asks if it needs batteries. Her grown-up helps read the box. Questions can help her choose.",
        "Emma steps back with Max. ‘I will think first,’ she says. She may buy another day, or buy nothing. A sign does not have to decide."
],
      idea: "Adverts try to encourage buying. Check the price and useful details. You can pause or ask a trusted grown-up.",
      question: "An advert says ‘Hurry!’ What can the girl do?",
      choices: [
        { text: "Pause and check the details", feedback: "Yes. She can ask about the price, size and any extra costs before choosing.", correct: true },
        { text: "Buy before looking at the price", feedback: "The excitement does not tell her the cost. She can stop and check first.", correct: false },
        { text: "Assume the picture proves everyone needs it", feedback: "People have different needs. A happy picture is not proof that everyone should buy something.", correct: false }
      ],
      activity: "Invent a poster for a pretend toy. Then point to three things a buyer would need to check: price, what is included and whether it suits their needs."
    },
    {
      title: "A kindness that cost nothing",
      paragraphs: [
        "At the harbour, a neighbour’s clean picnic paper blows away. Emma asks her grown-up if they can help. Together they pick up the paper nearby.",
        "‘Thank you,’ says the neighbour. Emma smiles. She has helped without spending money. Later, she draws a picture for a friend who feels lonely.",
        "‘You can care by helping, listening or taking turns,’ says the grown-up. ‘Giving money is a choice. You do not need to give money you need.’",
        "Emma still has her boat goal. She can care about that and other people too. She reads beside Max. Some happy parts of the day cost nothing."
],
      idea: "Kindness can involve time, attention or help. Donating money is a choice, not a test of how good someone is.",
      question: "Which is a way to show kindness without spending money?",
      choices: [
        { text: "Give a stranger your account details", feedback: "Account details are private. Ask a trusted grown-up for help with requests for money or personal information.", correct: false },
        { text: "Listen to a friend who wants company", feedback: "Yes. Listening and spending time together can show care without a purchase.", correct: true },
        { text: "Spend every pound so nobody is disappointed", feedback: "You do not need to spend money to prove you care. Your needs and boundaries matter too.", correct: false }
      ],
      activity: "Choose a kindness for a fictional character: listen, take turns or help with a safe task. You may point to your choice instead of saying it."
    },
    {
      title: "The choice at the harbour",
      paragraphs: [
        "Later, Emma has six pounds available for her boat goal. Her grown-up agrees she can use it for a toy. They return to the shop.",
        "The boat still costs six pounds. Emma checks the sail. The shopkeeper explains how to use it safely. ‘I still choose this boat,’ says Emma.",
        "She pays six pounds. No change is due because she pays the exact price. That money is now spent. She cannot use it to buy something else.",
        "At home, the boat floats in a shallow tray. Max watches from the dry side. Emma could also have kept saving. The important part was thinking and choosing."
],
      idea: "Check the price, think about what matters and choose. Finishing a saving goal does not mean you must buy.",
      question: "After saving enough, does she have to buy the boat?",
      choices: [
        { text: "Yes, a saving plan can never change", feedback: "A plan is a tool. It can change when circumstances or preferences change.", correct: false },
        { text: "Yes, otherwise the saving was wasted", feedback: "Money she has kept is still available for another permitted purpose. She can reconsider.", correct: false },
        { text: "No, she can check and choose again", feedback: "Yes. She can buy, keep saving or choose a different goal with her grown-up’s help.", correct: true }
      ],
      activity: "Choose your own ending. Draw the girl buying the boat, keeping her money or making another paper boat. Explain by pointing, drawing, typing or speaking."
    }
  ] satisfies BookChapter[],
  glossary: [
    { term: "Price", meaning: "How much something costs." },
    { term: "Cash", meaning: "Money in the form of coins and banknotes." },
    { term: "Account", meaning: "A record of money held with a bank or similar provider." },
    { term: "Budget", meaning: "A plan for the money available and how it will be used." },
    { term: "Saving", meaning: "Keeping money for later instead of spending it now." },
    { term: "Advert", meaning: "A message made to encourage interest in a product or service." }
  ]
};
