import type {LabTask} from "./learning-labs";
type Reading=Pick<LabTask,"idea"|"situation"|"choices"|"explanation">;
const v=(idea:string,situation:string,choices:[string,string,string],explanation:string):Reading=>({idea,situation,choices,explanation});
/** Authored Explorer and Strategist readings; Builder retains the original middle-level reading.
 * The right-answer position follows the base task, but wording and reasoning change.
 */
export const labAgeVariants:Record<string,[Reading,Reading]>={
  "brain-lab:memory":[
    v("Put things that belong together in a group.","Remember an apple, a pear, a sock and a hat. What could help?",["Look away and guess","Make a fruit group and a clothes group","Add lots more things"],"An apple and pear are fruit. A sock and hat are clothes. Two groups may help you remember. A picture list can help too."),
    v("A memory strategy should fit the task, and its usefulness can be tested.","You must remember a mixed list tomorrow. Which plan tests whether grouping helps you?",["Assume a confident feeling proves recall","Compare recall after grouping with recall after rereading","Make the list longer without checking"],"Compare what you actually recall, not just how easy the strategy feels. A written reminder may be the best tool when accurate recall matters. One trial cannot prove a universal result.")
  ],
  "brain-lab:attention":[
    v("Too many sounds can make a task hard.","A video is playing while you try to read one step. What could help?",["Pause the video","Make it louder","Start another video"],"Try one step with the video paused. You can ask for help or take a break. Different people need different supports."),
    v("Supporting attention means reducing competing demands while keeping useful supports.","Messages interrupt your revision, but a visual checklist helps you. Which change is worth testing?",["Silence message alerts and keep the checklist","Remove every support, including the checklist","Add more apps so you can practise ignoring them"],"Change the distraction you identified and keep a support that helps the task. Compare what you complete and understand. A strategy that helps today may need adapting tomorrow.")
  ],
  "brain-lab:perception":[
    v("A big-looking packet may not hold more.","One pretend pack says 2 items and another says 3 items. How can you check which has more?",["Choose the bright colour","Guess from the picture","Compare 2 and 3"],"Three is more than two. Looking at a clear label can help you check your first guess."),
    v("Package appearance and value for money are different questions.","One pack is 200 g for £2. Another is 300 g for £2.40. What helps compare value?",["Pick whichever box looks taller","Assume the higher total price is worse value","Calculate and compare each price per 100 g"],"The first costs £1 per 100 g. The second costs 80p per 100 g. Unit prices help compare value, but buying more is useful only if you need it and can afford the total.")
  ],
  "brain-lab:thinking":[
    v("We cannot read another person’s mind.","A friend does not wave back. What might be true?",["They must dislike you","They might not have seen you","You know every thought they have"],"Perhaps your friend did not see you. There may be other reasons too. You can check kindly later."),
    v("An observation can support several possible explanations.","You saw a friend pass without waving. Which conclusion keeps uncertainty clear?",["Their intention is now proven","They may not have noticed; more information would help","One action reveals their whole opinion of you"],"Not waving is the observation. Disliking someone is an interpretation. Consider alternatives before checking respectfully. You do not have to decide immediately.")
  ],
  "brain-lab:learning":[
    v("Try remembering one idea, then check it.","You have read a short story. How can you see what you remember?",["Choose an answer and check it","Count the pages only","Never look back"],"A question can show what you remember. If an idea is missing, look back or ask for help. A mistake is useful information."),
    v("Retrieval and feedback can reveal a gap that rereading alone may hide.","After studying an idea, which check gives evidence about whether you can use it?",["Explain it without looking, then check against the source","Judge learning only by time spent reading","Avoid any question that might reveal an error"],"Try recalling and applying the idea, check feedback, and revisit gaps. Repeat later if useful. Success on one familiar question does not establish understanding in every situation.")
  ],
  "brain-lab:decisions":[
    v("You can stop and think before buying.","A toy sign says ‘Hurry!’ What could you do?",["Buy without checking","Let the sign decide","Check your money and what you want"],"A sign cannot choose for you. You can check the cost, ask a grown-up and decide to wait."),
    v("Urgency can make an option feel more important than its evidence supports.","An advert counts down a discount on a product you had not planned to buy. Which response protects your choice?",["Treat the countdown as proof of value","Buy so you do not have to compare","Check total cost, priorities and what you would give up"],"The opportunity cost is the other use of the same money. Check the actual offer and your priorities. Waiting may be sensible even if the discount is real.")
  ],
  "mind-lab:feelings":[
    v("You can notice a feeling and ask for a pause.","A game feels upsetting. What can you do first?",["Notice how you feel and pause","Play even when you want to stop","Pretend feelings are forbidden"],"You may point to a feeling, show a picture or ask for help. You do not have to say your feeling aloud."),
    v("Feelings, interpretations and actions are connected, but they are not the same thing.","A setback makes you feel embarrassed and think ‘I always fail’. What is a useful first response?",["Notice the feeling, pause and examine that conclusion","Treat the feeling as proof that the conclusion is true","Force yourself to continue regardless of distress"],"An uncomfortable feeling is real, but it does not prove a sweeping judgement. You can choose privacy, a break or trusted support while deciding what to do next.")
  ],
  "mind-lab:self-awareness":[
    v("You can choose a way of learning that helps you.","A long instruction is hard. What could you ask for?",["More steps at once","A picture or one small step","No help at all"],"Pictures, a demonstration or one step can help. Asking for support is allowed."),
    v("Useful support depends on the person, task and setting.","Written instructions help in one activity but not a noisy practical task. What could you request?",["The same format regardless of the problem","A demonstration or shorter steps, then check what works","The removal of all support to prove independence"],"Independence can include choosing effective support. Try a relevant adjustment and explain what changed, without having to disclose a diagnosis or private information.")
  ],
  "mind-lab:resilience":[
    v("A new try can use a different plan.","Your block bridge falls. What could help?",["Keep every block the same forever","Say you are bad at everything","Try a wider bottom or ask for help"],"You can change one part, ask for help or take a break. You do not need to keep trying when you need to stop."),
    v("Persistence is useful when it includes information, boundaries and a change of strategy.","A project fails the same test twice. Which next step uses the evidence?",["Repeat the unchanged plan indefinitely","Blame your ability without examining the design","Review the failure, change one part, or seek advice"],"State what failed, choose a testable change and compare results. Resting, getting support or deciding to stop can also be reasonable. Resilience does not mean tolerating harm.")
  ],
  "mind-lab:adaptability":[
    v("A plan can change.","Rain stops your picnic. What could you do?",["Choose a safe indoor picnic","Say nothing good can happen now","Go out without checking safety"],"You can feel sad about the rain and still try another activity. A grown-up can help you choose."),
    v("An alternative plan can preserve a goal while changing the method.","Weather cancels a community event outdoors. Which response addresses the constraint?",["Compare safe indoor options against the event’s main goal","Assume a changed method makes the goal worthless","Ignore the weather and proceed without checking"],"Identify the goal, safety constraint and resources before comparing alternatives. An indoor event may preserve some goals while changing space or capacity. Name the trade-offs.")
  ],
  "mind-lab:problem-solving":[
    v("Start with one small job.","There is no space to draw on your desk. Where could you begin?",["Push everything onto the floor","Put the pencils in a pot","Ask to buy a new desk straight away"],"Putting pencils away makes a small clear space. Then you can choose the next step or ask for help."),
    v("Define a problem before choosing a costly solution.","A cluttered workspace slows a shared task. What is a sensible first test?",["Move the clutter into someone else’s space","Organise one category and check whether access improves","Replace all the furniture without investigating"],"A low-cost, reversible test gives information. Observe whether the change helps the people using the space, then decide whether a larger change is needed.")
  ],
  "mind-lab:relationships":[
    v("People can choose different things.","You and a friend want different games. What could help?",["Only the loudest person chooses","Stop listening to your friend","Ask each other and make a fair plan"],"You can point, use pictures or speak. Taking turns is one option, and each person can say no."),
    v("A fair group decision includes accessible contributions and respect for boundaries.","Two friends prefer different activities and one does not want to speak. Which approach includes them?",["Let the confident speaker decide for everyone","Treat silence as agreement","Offer another response method and compare fair options"],"Check preferences without forcing speech. Taking turns, combining ideas or choosing another activity can fit different situations. Agreement is not meaningful if someone cannot respond or decline.")
  ],
  "mind-lab:boundaries":[
    v("You can say no to sharing your picture.","A friend wants to share your photo. You do not want that. What can you say?",["No, please do not share it","I must say yes","I will share your photo instead"],"Your choice matters. You can point to no or ask a trusted grown-up to help."),
    v("Consent to sharing should be freely given and specific to the situation.","A friend wants to post a photo you do not want shared. Which response states your boundary?",["I do not consent to posting this photo; please keep it private","I must agree to keep the friendship","I will retaliate by posting their photo"],"You may decline without proving that the image is harmful. If the boundary is ignored, ask for removal and trusted adult support. Do not retaliate by exposing someone else’s information.")
  ],
  "mind-lab:calm-choice":[
    v("You can ask for a break.","A room is too noisy for you. What could you try?",["Stay because breaks are not allowed","Ask for a quieter place","Make more noise"],"A quiet space, movement or help may suit you. Choose with a trusted grown-up. You can pass on this activity."),
    v("A break plan should support communication, safety and personal choice.","A busy setting is becoming overwhelming. Which plan respects your needs?",["Remain until you cannot cope","Use an agreed break signal and access a suitable space","Assume the same calming activity must help everyone"],"Plan a way to request support without needing a spoken explanation. Different sensory needs call for different adjustments. Returning should depend on readiness and the situation, not a demand to hide distress.")
  ],
  "future-skills:critical-thinking":[
    v("A video can say something that is not true.","A video says a drink makes every child clever. What should you check?",["The music only","Whether the person smiles","Who says it and what shows it is true"],"A happy voice is not proof. A trusted grown-up can help check the claim."),
    v("A claim needs evidence that actually supports its conclusion.","A creator sells a drink while claiming it improves every learner’s results. Which check is strongest?",["Count likes as scientific proof","Rely on the creator’s confidence","Check independent evidence, its limits and the seller’s interest"],"Look for who benefits, the quality of the evidence and whether it supports the exact claim. A testimonial or popularity does not establish a universal effect.")
  ],
  "future-skills:creativity":[
    v("One object can have different uses.","You have an empty cardboard box. What can you do first?",["Think of a few ways to use it","Say it has only one use","Copy without choosing"],"Draw, point or build an idea. You can try another if the first does not fit."),
    v("Generating alternatives and evaluating constraints are different parts of creative work.","A team must reuse a box with no new materials. Which first step opens up useful options?",["Generate several ideas, then compare them against the constraint","Reject every idea before exploring it","Copy the first design without checking fit"],"Separate idea generation from judgement. Test a promising option against purpose, materials and access, then use feedback to revise it.")
  ],
  "future-skills:entrepreneurship":[
    v("Try one small idea before making lots.","You want to make bookmarks for a pretend shop. What could you do first?",["Buy a huge pile of materials","Make one sample and ask what helps","Assume everyone wants one"],"A sample lets you learn before using more materials. Ask a grown-up before any real selling."),
    v("A small pilot can test a business assumption while limiting resources at risk.","You are considering 100 bookmarks for a supervised project. Which first step gives useful evidence?",["Spend the full budget before checking demand","Test a sample, estimate costs and seek relevant feedback","Treat expressions of interest as guaranteed sales"],"Define what you want to learn and the maximum trial cost. Feedback can change the design or the decision to proceed. Sales income is not profit until relevant costs are deducted.")
  ],
  "future-skills:leadership":[
    v("A leader can help others join in.","Your group wants to make a poster. How can you begin?",["Do everything without asking","Give orders straight away","Ask for ideas and choose jobs together"],"People can point, draw or speak. Share useful jobs and make room for different ideas."),
    v("Leadership includes accessible participation, clear roles and accountability.","A team has a deadline and different strengths. What is a useful opening decision?",["Centralise every task with one person","Allocate roles without checking capacity","Agree the goal, invite contributions and assign workable roles"],"Check that people understand the goal and can contribute in a suitable way. Agree a check-in and a fair route for resolving disagreement. Share credit and responsibility.")
  ],
  "future-skills:ai-literacy":[
    v("A computer answer can be wrong.","An AI tool gives a surprising fact. What should you do?",["Check with a trusted source and grown-up","Believe every computer answer","Share it without checking"],"AI can make mistakes. Checking an answer helps. You do not need to open an AI account for this activity."),
    v("Fluent AI output is not evidence that a statement or citation is accurate.","An AI response names a surprising study. Which check is needed before relying on it?",["Verify the source exists and supports the specific claim","Treat a confident tone as verification","Repeat the answer until it feels familiar"],"Check the original source, author, context and what remains uncertain. A real citation can still fail to support the conclusion. Follow age and privacy rules for any real tool.")
  ],
  "future-skills:digital-safety":[
    v("Keep passwords private.","A game message asks for your password to give a prize. What can you do?",["Send the password","Do not send it; ask a trusted grown-up","Try a friend’s password"],"A prize is not a reason to share a password. Stop and get help without opening the message’s links."),
    v("A reward can be used to pressure someone into sharing credentials.","An unexpected message claims you must provide your password to receive a prize. What fits?",["Send it through a private message","Refuse, use trusted reporting tools and tell a trusted adult","Test the request with someone else’s credentials"],"Do not open suspicious links or submit credentials. Check through an independently trusted route. Private messaging does not make a request safe.")
  ],
  "future-skills:practical-skills":[
    v("A picture list can help you pack.","You need to pack your school bag. What could help?",["Wait until you are leaving","Choose random things","Use a short picture or word list"],"Point to each item as you pack it. Ask for help if an item is missing."),
    v("A checklist is useful when its steps match the task and can be reviewed.","You repeatedly forget one item when preparing for an activity. Which method can you test?",["Rely on rushing at the last moment","Make the list longer without checking relevance","Use a short checklist, observe omissions and revise it"],"Include necessary actions, test the list in practice and remove unhelpful steps. Independence can include reminders and accessible formats.")
  ],
  "future-skills:autonomy":[
    v("Check the money before choosing.","You have £5. A notebook is £3 and a toy is £4. What can you afford now?",["One item, with money left","Both items for £5","Both, with nothing left"],"Three plus four is seven, which is more than five. You can choose one, wait or choose neither."),
    v("A budget makes trade-offs visible without deciding your priorities for you.","With £5 available, a £3 notebook and £4 toy cannot both be bought without extra money. Which statement fits?",["Either item is affordable alone; the alternative use is an opportunity cost","Both are affordable because each costs less than £5","Borrowing removes the cost of the choice"],"The combined price is £7. Choosing one leaves a different balance and delays another use of the money. Waiting or choosing neither may also fit your priorities.")
  ]
};
export function labTaskAtLevel(labSlug:string,task:LabTask,level:number,readings:typeof labAgeVariants=labAgeVariants):LabTask {
  const variants=readings[`${labSlug}:${task.id}`];
  if(!variants||level===1)return task;
  return {...task,...variants[level===0?0:1]};
}
