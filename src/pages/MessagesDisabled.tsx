import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const MessagesDisabled = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Messages Coming Soon!</h3>
            <p className="text-muted-foreground">
              We're working on bringing you secure messaging. Check back soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MessagesDisabled;