import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

const EventsDisabled = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Events Coming Soon!</h3>
            <p className="text-muted-foreground">
              We're working on bringing you amazing LGBTQIA+ events. Check back soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EventsDisabled;