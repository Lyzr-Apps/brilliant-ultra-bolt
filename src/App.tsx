'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  RefreshCw,
  Send,
  Calendar,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import parseLLMJson from '@/utils/jsonParser'
import { cn } from '@/lib/utils'

// Types
interface TeamMember {
  name: string
  mqls: number
  activities: string[]
  status: 'submitted' | 'pending' | 'no_response'
  last_updated: string
  avatar?: string
}

interface DailyBreakdown {
  date: string
  mqls: number
  campaigns: number
}

interface TeamMetrics {
  total_mqls: number
  response_rate: number
  active_campaigns: number
  top_performer: string
}

interface AgentResponse {
  result: {
    collection_status: string
    period: string
    team_metrics: TeamMetrics
    daily_breakdown: DailyBreakdown[]
    team_members: TeamMember[]
    non_respondents: string[]
    query_response: string | null
  }
  confidence: number
  metadata: {
    processing_time: string
    messages_sent: number
    responses_received: number
    data_sources: string[]
  }
}

interface AnalyticsResponse {
  query_answer: string
  key_metrics: {
    average_mql_per_member: number
    growth_rate: number
    response_time_avg: string
    campaign_effectiveness: number
  }
  performance_analysis: {
    top_performers: { name: string; score: number }[]
    under_performing: { name: string; area: string }[]
    team_trends: string[]
  }
  insights: string[]
  recommendations: string[]
  confidence: number
  metadata: {
    analysis_timestamp: string
    data_sources: string[]
    processing_time: string
  }
}

// Status color mapping
const statusColors = {
  submitted: '#10B981',
  pending: '#F59E0B',
  no_response: '#EF4444',
}

const statusBgColors = {
  submitted: 'bg-emerald-50 border-emerald-200',
  pending: 'bg-amber-50 border-amber-200',
  no_response: 'bg-red-50 border-red-200',
}

// Mock initial data
const mockInitialData: AgentResponse = {
  result: {
    collection_status: 'In Progress',
    period: '2025-10-18 to 2025-10-25',
    team_metrics: {
      total_mqls: 428,
      response_rate: 85.7,
      active_campaigns: 12,
      top_performer: 'Sarah Chen',
    },
    daily_breakdown: [
      { date: '2025-10-19', mqls: 54, campaigns: 2 },
      { date: '2025-10-20', mqls: 62, campaigns: 3 },
      { date: '2025-10-21', mqls: 58, campaigns: 2 },
      { date: '2025-10-22', mqls: 71, campaigns: 4 },
      { date: '2025-10-23', mqls: 65, campaigns: 3 },
      { date: '2025-10-24', mqls: 78, campaigns: 3 },
      { date: '2025-10-25', mqls: 82, campaigns: 3 },
    ],
    team_members: [
      {
        name: 'Sarah Chen',
        mqls: 89,
        activities: ['Email campaign', 'LinkedIn outreach', 'Event follow-up'],
        status: 'submitted',
        last_updated: new Date(Date.now() - 15 * 60000).toISOString(),
        avatar: 'SC',
      },
      {
        name: 'Marcus Johnson',
        mqls: 76,
        activities: ['Phone calls', 'Demo scheduling', 'Content marketing'],
        status: 'submitted',
        last_updated: new Date(Date.now() - 35 * 60000).toISOString(),
        avatar: 'MJ',
      },
      {
        name: 'Elena Rodriguez',
        mqls: 64,
        activities: ['Webinar promotion', 'Partner outreach'],
        status: 'pending',
        last_updated: new Date(Date.now() - 2 * 3600000).toISOString(),
        avatar: 'ER',
      },
      {
        name: 'David Kim',
        mqls: 0,
        activities: [],
        status: 'no_response',
        last_updated: new Date(Date.now() - 24 * 3600000).toISOString(),
        avatar: 'DK',
      },
      {
        name: 'Jennifer Walsh',
        mqls: 71,
        activities: ['Content creation', 'Social media', 'Referral program'],
        status: 'submitted',
        last_updated: new Date(Date.now() - 45 * 60000).toISOString(),
        avatar: 'JW',
      },
      {
        name: 'Alex Thompson',
        mqls: 28,
        activities: ['Event attendance'],
        status: 'pending',
        last_updated: new Date(Date.now() - 3 * 3600000).toISOString(),
        avatar: 'AT',
      },
    ],
    non_respondents: ['David Kim'],
    query_response: null,
  },
  confidence: 0.95,
  metadata: {
    processing_time: '2.3s',
    messages_sent: 6,
    responses_received: 5,
    data_sources: ['Slack', 'CRM'],
  },
}

// Helper: Format time ago
function timeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Helper: Get initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// Metric Card Component
function MetricCard({
  title,
  value,
  icon: Icon,
  suffix = '',
}: {
  title: string
  value: string | number
  icon: React.ElementType
  suffix?: string
}) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {value}
              {suffix}
            </p>
          </div>
          <Icon className="h-8 w-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  )
}

// Team Member Card Component
function TeamMemberCard({ member }: { member: TeamMember }) {
  const statusColor = statusColors[member.status]
  const statusLabel =
    member.status === 'submitted'
      ? 'Submitted'
      : member.status === 'pending'
        ? 'Pending'
        : 'No Response'

  return (
    <Card className={cn('border-2', statusBgColors[member.status])}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="text-sm font-bold">{member.avatar || getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{member.name}</p>
              <p className="text-xs text-gray-500">{timeAgo(member.last_updated)}</p>
            </div>
          </div>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: statusColor }}
            title={statusLabel}
          />
        </div>

        <div className="mb-4">
          <p className="text-3xl font-bold text-gray-900">{member.mqls}</p>
          <p className="text-xs text-gray-600">MQLs</p>
        </div>

        {member.activities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase">Activities</p>
            <div className="space-y-1">
              {member.activities.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-600">{activity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Badge
          className="mt-4 capitalize"
          style={{
            backgroundColor: statusColor,
            color: 'white',
          }}
        >
          {statusLabel}
        </Badge>
      </CardContent>
    </Card>
  )
}

// Chat Panel Component
function ChatPanel({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: AgentResponse | null
}) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: 'agent',
      content: 'Hi! I can help you analyze marketing metrics. Ask me anything about team performance, MQL trends, or campaign activities.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim()) return

      const userMessage = input.trim()
      setInput('')
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
      setLoading(true)

      try {
        const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'sk-default-obhGvAo6gG9YT9tu6ChjyXLqnw7TxSGY',
          },
          body: JSON.stringify({
            user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
            agent_id: '68fd2aa7a39d463331e0376b',
            session_id: `session-${Math.random().toString(36).substr(2, 9)}`,
            message: userMessage,
          }),
        })

        const responseText = await response.text()
        const parsedResponse = parseLLMJson(responseText, { message: 'Unable to process response' })

        const agentMessage =
          parsedResponse?.message ||
          parsedResponse?.result?.query_response ||
          'I received your message but could not generate a response.'

        setMessages((prev) => [...prev, { role: 'agent', content: agentMessage }])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { role: 'agent', content: 'Sorry, I encountered an error. Please try again.' },
        ])
      } finally {
        setLoading(false)
      }
    },
    [input]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md h-[600px] flex flex-col">
        <DialogTitle>Marketing Agent</DialogTitle>
        <DialogDescription>Ask questions about marketing metrics and performance</DialogDescription>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 mb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-xs px-3 py-2 rounded-lg text-sm',
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 flex-1" />
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about metrics..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add Employee Dialog Component
function AddEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      // Could integrate with agent or API here
      // For now, just show success message
      setFormData({ name: '', email: '' })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogDescription>Add a new marketing team member to track their MQLs</DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@company.com"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600">
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Main App Component
export default function App() {
  const [data, setData] = useState<AgentResponse>(mockInitialData)
  const [loading, setLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMember, setSelectedMember] = useState('all')
  const [error, setError] = useState<string | null>(null)

  // Refresh data from agent
  const refreshData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sk-default-obhGvAo6gG9YT9tu6ChjyXLqnw7TxSGY',
        },
        body: JSON.stringify({
          user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
          agent_id: '68fd2aa7a39d463331e0376b',
          session_id: `session-${Math.random().toString(36).substr(2, 9)}`,
          message: 'Collect latest marketing data and MQL metrics for this week. Include team member responses, total MQLs, response rate, active campaigns, and top performer.',
        }),
      })

      const responseText = await response.text()
      const parsedData = parseLLMJson(responseText, mockInitialData)

      // Ensure response has result property
      if (parsedData?.result) {
        setData(parsedData)
      } else if (parsedData?.collection_status) {
        // Handle direct result format
        setData({ ...mockInitialData, result: parsedData })
      } else {
        setError('Failed to parse agent response')
      }
    } catch (err) {
      setError('Failed to fetch data from agent')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter members
  const filteredMembers =
    selectedMember === 'all'
      ? data.result.team_members
      : data.result.team_members.filter((m) => m.name === selectedMember)

  const metrics = data.result.team_metrics

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                L
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
                <p className="text-sm text-gray-500">Weekly MQL collection & team performance</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-col sm:flex-row w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-gray-600" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none p-0 h-auto text-sm"
                />
              </div>

              <AddEmployeeDialog />

              <Button
                onClick={refreshData}
                disabled={loading}
                variant="outline"
                size="sm"
                className="gap-2 w-full sm:w-auto"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                Refresh
              </Button>

              <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto">
                    <Zap className="h-4 w-4 mr-2" />
                    Ask Agent
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500 mt-4">
            Period: {data.result.period} • Status: {data.result.collection_status} • Confidence: {(data.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Error</AlertTitle>
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total MQLs"
            value={metrics.total_mqls}
            icon={TrendingUp}
          />
          <MetricCard
            title="Response Rate"
            value={metrics.response_rate.toFixed(1)}
            icon={Users}
            suffix="%"
          />
          <MetricCard
            title="Active Campaigns"
            value={metrics.active_campaigns}
            icon={Zap}
          />
          <MetricCard
            title="Top Performer"
            value={metrics.top_performer}
            icon={Users}
          />
        </div>

        {/* Two Column Layout: Chart + Team Members */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Chart */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>7-Day MQL Trend</CardTitle>
              <CardDescription>Daily MQL count over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.result.daily_breakdown}>
                  <defs>
                    <linearGradient id="colorMqls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mqls"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Right: Team Members List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {data.result.team_members.map((member) => (
                    <SelectItem key={member.name} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <TeamMemberCard key={member.name} member={member} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Non-Respondents Alert */}
        {data.result.non_respondents.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Pending Responses</AlertTitle>
            <AlertDescription className="text-amber-800">
              {data.result.non_respondents.join(', ')} {data.result.non_respondents.length === 1 ? 'has' : 'have'} not responded. Reminders sent 2 hours ago.
            </AlertDescription>
          </Alert>
        )}
      </main>

      {/* Chat Panel */}
      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} data={data} />
    </div>
  )
}