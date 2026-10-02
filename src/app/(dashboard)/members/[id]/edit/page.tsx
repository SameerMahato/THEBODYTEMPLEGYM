import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import EditMemberForm from '@/components/members/EditMemberForm'
import { getMemberForEdit } from '@/lib/data/members'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await getMemberForEdit(id)
  if (!member) notFound()

  return (
    <div>
      <PageHeader title="EDIT MEMBER" />
      <div style={{ padding: '28px 32px', maxWidth: '640px' }}>
        <EditMemberForm id={id} initial={member} />
      </div>
    </div>
  )
}
