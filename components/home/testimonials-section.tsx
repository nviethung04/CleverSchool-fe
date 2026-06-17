import { Card, CardContent } from "@/components/ui/card"

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  color: string
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

// Server Component
export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Phụ huynh nói gì về chúng tôi</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Server Component
function TestimonialCard({ name, role, content, color }: Omit<Testimonial, "id">) {
  return (
    <Card className={`card-kid border-cs-${color}`}>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className={`bg-cs-${color} bg-opacity-20 rounded-full p-2 mr-3`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-cs-${color}`}
            >
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
            </svg>
          </div>
          <div>
            <h4 className="font-bold">{name}</h4>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
        <p className="text-gray-600 italic">{content}</p>
      </CardContent>
    </Card>
  )
}
