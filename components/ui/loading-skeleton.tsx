import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingSkeletonProps {
  type: "features" | "testimonials" | "learning-path"
}

export function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  switch (type) {
    case "features":
      return (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto mb-12" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="card-kid">
                  <CardContent className="p-6 text-center">
                    <Skeleton className="h-10 w-10 mx-auto mb-4" />
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )

    case "testimonials":
      return (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-64 mx-auto mb-12" />
            <div className="grid md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="card-kid">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-12 w-12 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )

    case "learning-path":
      return (
        <section className="py-16 cloud-bg">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto mb-12" />
            <div className="bg-white rounded-3xl shadow-lg p-6 max-w-4xl mx-auto">
              <Skeleton className="w-full h-64 rounded-2xl" />
            </div>
          </div>
        </section>
      )

    default:
      return <Skeleton className="h-32 w-full" />
  }
}
