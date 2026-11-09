import type { Block } from '@/lib/blog';

/** Starting layouts for a new post, picked by type (like BrasQ's post types). */
export type StarterType = 'guide' | 'howto' | 'comparison' | 'casestudy' | 'blank';

export const STARTER_LABEL: Record<StarterType, string> = {
  guide: 'Guide', howto: 'How-to (steps)', comparison: 'Comparison', casestudy: 'Case study', blank: 'Blank',
};

export type Starter = { takeaways: string; body: Block[]; faqs: [string, string][] };

const h2 = (text: string): Block => ({ type: 'h2', id: '', text });
const p = (text: string): Block => ({ type: 'p', text });

export function starter(type: StarterType): Starter {
  switch (type) {
    case 'guide': return {
      takeaways: 'The single most important point of the article.\nA second key point readers should remember.\nA practical recommendation they can act on today.',
      body: [
        p('Open with the problem the reader has and what this guide will help them do. Link to a related guide if useful: [link building guides](/blog/category/link-building).'),
        h2('What is [the topic]?'),
        p('Define the topic in plain words in the first sentence: this is what gets quoted in search snippets.'),
        h2('Why it matters'),
        p('Explain the impact with an example or a number from your own data.'),
        h2('How to do it'),
        { type: 'steps', items: [['First step', 'What to do and why.'], ['Second step', 'What to do and why.'], ['Third step', 'What to do and why.']] },
        h2('Common mistakes'),
        { type: 'ul', items: ['A mistake and how to avoid it.', 'Another mistake and how to avoid it.'] },
      ],
      faqs: [['A question people search for?', 'A direct answer in two or three sentences.'], ['Another common question?', 'A direct answer.']],
    };
    case 'howto': return {
      takeaways: 'What the reader will be able to do after following the steps.\nHow long it takes and what they need.',
      body: [
        p('One paragraph on what this process achieves and who it is for.'),
        h2('What you need'),
        { type: 'ul', items: ['Tool or access needed', 'Time required'] },
        h2('Step-by-step'),
        { type: 'steps', items: [['Step one', 'Detail.'], ['Step two', 'Detail.'], ['Step three', 'Detail.'], ['Step four', 'Detail.']] },
        { type: 'image', src: '', alt: '', caption: 'Screenshot of the result.' },
        h2('Checking the result'),
        p('How to confirm it worked, and what to do if it did not.'),
      ],
      faqs: [['How long does this take?', 'Answer.']],
    };
    case 'comparison': return {
      takeaways: 'Choose option A when …\nChoose option B when …\nThe deciding factor is usually …',
      body: [
        p('Introduce the two options and the decision the reader is trying to make.'),
        h2('Quick comparison'),
        { type: 'table', head: ['Factor', 'Option A', 'Option B'], rows: [['Cost', '', ''], ['Effort', '', ''], ['Best for', '', '']] },
        h2('When to choose option A'),
        p('Situations where A is the better fit.'),
        h2('When to choose option B'),
        p('Situations where B is the better fit.'),
        h2('Our verdict'),
        p('A clear recommendation.'),
      ],
      faqs: [['Can I use both?', 'Answer.']],
    };
    case 'casestudy': return {
      takeaways: 'The result in one line (with a number).\nWhat made the difference.\nWhat others can copy.',
      body: [
        p('Who the client is, what they wanted and the starting point.'),
        h2('The challenge'),
        p('What was hard about it.'),
        h2('The approach'),
        { type: 'steps', items: [['What we did first', 'Detail.'], ['What we did next', 'Detail.'], ['How we monitored it', 'Detail.']] },
        h2('Results'),
        { type: 'table', head: ['Metric', 'Before', 'After'], rows: [['', '', '']] },
        { type: 'quote', text: 'A quote from the client.', cite: 'Name, Role, Company' },
        h2('What we learned'),
        p('The lessons other readers can apply.'),
      ],
      faqs: [],
    };
    case 'blank': return { takeaways: '', body: [p('')], faqs: [] };
  }
}
