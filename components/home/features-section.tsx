import { Card, CardContent } from "@/components/ui/card"
import { LucideBookOpen, LucideBarChart, LucideUsers, LucideGamepad2 } from "lucide-react"

interface Feature {
  id: number
  icon: string
  title: string
  description: string
  color: string
}

interface FeaturesSectionProps {
  features: Feature[]
}

const iconMap = {
  BookOpen: LucideBookOpen,
  BarChart: LucideBarChart,
  Users: LucideUsers,
  Gamepad2: LucideGamepad2,
}

// Server Component
export function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Tính năng nổi bật</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Clever School giúp người học học tiếng Anh một cách hiệu quả và thú vị với các tính năng được thiết kế riêng cho lứa tuổi
          tiểu học
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <FeatureCard key={feature.id} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Server Component
function FeatureCard({ icon, title, description, color }: Omit<Feature, "id">) {
  const IconComponent = iconMap[icon as keyof typeof iconMap]

  return (
    <Card
      className={`card-kid border-Clever School-${color} hover:border-Clever School-${color} hover:border-2 transition-all duration-300`}
    >
      <CardContent className="p-6 text-center">
        <div className="mb-4 flex justify-center">
          {IconComponent && <IconComponent className={`h-10 w-10 text-Clever School-${color}`} />}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}
