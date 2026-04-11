import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { faqItems } from "@/lib/constants"

type FAQItem = {
  question: string
  answer: string
}

interface FAQProps {
  items: FAQItem[]
}

export function FAQItem({ items }: FAQProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>
            <div dangerouslySetInnerHTML={{ __html: convertLinksToAnchors(item.answer) }} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default function FAQ() {
    return (
        <main className="flex flex-col items-center justify-between px-4 py-6 md:py-14">
            <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">
                <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                <FAQItem items={faqItems} />
            </div>
        </main>
    )
}


function convertLinksToAnchors(text: string): string {
  // Regex for website links
  const websiteRegex = /(https?:\/\/(?!github\.com)[^\s]+)/gi

  // Regex for GitHub URLs (including repositories)
  const githubRegex = /(https?:\/\/)?(www\.)?github\.com(\/[a-zA-Z0-9_-]+){0,2}\/?/gi

  // Regex for specific email addresses
  const infoEmailRegex = /\b(info@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)\b/gi
  const outreachEmailRegex = /\b(outreach@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)\b/gi

  // Replace website links
  text = text.replace(websiteRegex, (match) => {
    const url = match.startsWith("http") ? match : `https://${match}`
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">Website</a>`
  })

  // Replace GitHub URLs
  text = text.replace(githubRegex, (match) => {
    const url = match.startsWith("http") ? match : `https://${match}`
    if (url === "https://github.com" || url === "https://github.com/") {
      return '<a href="https://github.com" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">GitHub</a>'
    } else {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">GitHub</a>`
    }
  })

  // Replace info@griotandgrits.org email addresses
  text = text.replace(infoEmailRegex, '<a href="mailto:info@griotandgrits.org" class="text-blue-500 underline">info@griotandgrits.org</a>')

  // Replace outreach@griotandgrits.org email addresses
  text = text.replace(outreachEmailRegex, '<a href="mailto:outreach@griotandgrits.org" class="text-blue-500 underline">outreach@griotandgrits.org</a>')

  return text
}