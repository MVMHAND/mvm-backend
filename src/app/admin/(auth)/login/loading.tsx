import { Card, CardContent } from '@/components/ui/Card'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mvm p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
