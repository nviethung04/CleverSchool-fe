import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LoginSkeleton() {
  return (
    <Card className="w-full max-w-md border-Clever School-purple">
      <CardHeader>
        <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </CardFooter>
    </Card>
  )
}
