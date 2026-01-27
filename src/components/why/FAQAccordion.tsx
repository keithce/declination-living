import type { FAQItem } from '@/components/why/data/faq-items'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQAccordionProps {
  items: Array<FAQItem>
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="bg-slate-800/30 border border-slate-700/50 rounded-xl px-6 overflow-hidden"
        >
          <AccordionTrigger className="text-left py-5 hover:no-underline">
            <span className="font-display text-lg text-white pr-4">{item.question}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-slate-300 leading-relaxed">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
