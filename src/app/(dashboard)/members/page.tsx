import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import MembersTable from '@/components/members/MembersTable'
import { getMembers } from '@/lib/data/members'

export default async function MembersPage() {
  const result = await getMembers({})
  if (!result) redirect('/login')

  return (
    <div>
      <PageHeader
        title="MEMBERS"
        action={
          <Link href="/members/new">
            <Button>+ Add Member</Button>
          </Link>
        }
      />
      <MembersTable initialMembers={result.members} initialTotal={result.total} />
    </div>
  )
}
