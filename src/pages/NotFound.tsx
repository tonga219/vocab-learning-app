import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { PageContainer } from '../components/Layout';
import { EmptyState } from '../components/EmptyState';
import { buttonClass } from '../components/Button';

export function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <PageContainer>
      <EmptyState
        icon={<SearchX size={24} />}
        title={`This ${what} doesn't exist`}
        description="It may have been deleted."
        action={
          <Link to="/library" className={buttonClass({ variant: 'secondary' })}>
            Back to Library
          </Link>
        }
      />
    </PageContainer>
  );
}
