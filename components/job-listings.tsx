import Link from "next/link"
import { MapPin, Clock, DollarSign, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Mock data for job listings
const jobListings = [
  {
    id: 1,
    title: "Community Manager",
    company: "The Collective",
    location: "New York, NY",
    type: "Full-time",
    salary: "$50,000 - $65,000",
    posted: "2 days ago",
    featured: true,
  },
  {
    id: 2,
    title: "Operations Director",
    company: "WorkHub Central",
    location: "London, UK",
    type: "Full-time",
    salary: "£45,000 - £60,000",
    posted: "1 week ago",
    featured: true,
  },
  {
    id: 3,
    title: "General Manager",
    company: "Nomad Space",
    location: "Berlin, Germany",
    type: "Full-time",
    salary: "€55,000 - €70,000",
    posted: "3 days ago",
    featured: false,
  },
  {
    id: 4,
    title: "Marketing Coordinator",
    company: "Flex Workspace",
    location: "Singapore",
    type: "Full-time",
    salary: "$45,000 - $55,000",
    posted: "5 days ago",
    featured: false,
  },
  {
    id: 5,
    title: "Events Manager",
    company: "Creative Hub",
    location: "Toronto, Canada",
    type: "Part-time",
    salary: "CAD 30,000 - 40,000",
    posted: "1 day ago",
    featured: false,
  },
]

export default function JobListings() {
  return (
    <div className="space-y-4">
      {jobListings.map((job) => (
        <Card key={job.id} className={job.featured ? "border-gold" : ""}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold">{job.title}</h3>
                  {job.featured && <Badge className="bg-gold text-midnight hover:bg-gold/80">Featured</Badge>}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Building className="mr-1 h-4 w-4" />
                  <span>{job.company}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center">
                    <MapPin className="mr-1 h-3 w-3" /> {job.location}
                  </Badge>
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" /> {job.type}
                  </Badge>
                  <Badge variant="outline" className="flex items-center">
                    <DollarSign className="mr-1 h-3 w-3" /> {job.salary}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">Posted {job.posted}</div>
                <Link href={`/jobs/${job.id}`}>
                  <Button variant="outline">View Job</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
