import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What file types are supported?",
    a: "goStuddy acts as a unified workspace for all your learning materials. We currently support PDFs, audio lectures, video files, images, and YouTube links — bringing them all together in one place.",
  },
  // {
  //   q: "Is goStuddy free to use?",
  //   a: "Yes! You can get started for free with no credit card required. We offer generous free usage to help you experience the platform.",
  // },
  {
    q: "How does the AI understand my content?",
    a: "goStuddy uses Gemini to deeply read and index your uploaded materials. It understands the structure, concepts, and connections across all your documents and videos.",
  },
  {
    q: "Can I use it for any subject?",
    a: "Absolutely. goStuddy works with any academic subject — biology, history, math, law, engineering, and more. If you can upload study materials for it, goStuddy can help.",
  },
  {
    q: "What makes this different from ChatGPT?",
    a: "ChatGPT is a chatbot that answers questions. goStuddy is an AI study companion that works with you throughout your session. Together, you plan, navigate your materials, maintain focus, and adapt to your energy. It's proactive collaboration, not just reactive answers.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="bg-muted/50 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
