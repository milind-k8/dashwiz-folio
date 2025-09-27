import { Card } from '@/components/ui/card';

export function CreditCard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">My Cards</h3>
        <button className="text-primary text-sm font-medium hover:underline">
          View All
        </button>
      </div>
      
      <Card className="relative bg-gradient-card text-white border border-primary overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div>
              <p className="text-white/80 text-xs sm:text-sm mb-1">Balance</p>
              <p className="text-xl sm:text-2xl font-bold">₹2,190.19</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs sm:text-sm">VISA</p>
            </div>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-4 gap-1 text-center tracking-widest text-sm sm:text-base">
              <span>0316</span>
              <span>7893</span>
              <span>0715</span>
              <span>2014</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs mb-1">Card Holder</p>
                <p className="font-medium text-sm">John Smith</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs mb-1">Valid Thru</p>
                <p className="font-medium text-sm">12/24</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-white/10 rounded-full"></div>
      </Card>
      
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Your Balance</span>
          <p className="font-semibold text-foreground">₹2190.19</p>
        </div>
        <div className="text-right">
          <span className="text-success">+5.8%</span>
          <p className="text-muted-foreground text-xs sm:text-sm">1250 / US Dollar</p>
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-muted-foreground text-sm">Active</span>
      </div>
    </div>
  );
}