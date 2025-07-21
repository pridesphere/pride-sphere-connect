import Layout from "@/components/layout/Layout";
import MentalHealthTools from "@/components/wellness/MentalHealthTools";

const Wellness = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4 py-6">
          <h1 className="text-3xl font-bold pride-text">
            ✨ Mental Health & Wellness
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your well-being matters. Take care of yourself with our gentle tools and resources. 💖
          </p>
        </div>
        
        <MentalHealthTools />
      </div>
    </Layout>
  );
};

export default Wellness;