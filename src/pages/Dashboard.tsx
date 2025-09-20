import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  FileText, 
  Heart, 
  MessageCircle, 
  Phone, 
  Clock,
  Star,
  ArrowRight,
  User,
  Activity,
  MapPin
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: "Schedule Consultation",
      description: "Book a consultation with our specialists",
      icon: Calendar,
      action: () => navigate('/contact'),
      color: "bg-primary text-background"
    },
    {
      title: "Get Free Quote",
      description: "Get personalized treatment pricing",
      icon: FileText,
      action: () => navigate('/contact'),
      color: "bg-secondary text-secondary-foreground"
    },
    {
      title: "Find Doctors",
      description: "Browse our specialist doctors",
      icon: User,
      action: () => navigate('/doctors'),
      color: "bg-accent text-accent-foreground"
    },
    {
      title: "View Treatments",
      description: "Explore available medical procedures",
      icon: Heart,
      action: () => navigate('/treatments'),
      color: "bg-muted text-muted-foreground"
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      doctor: "Dr. Ahmed Mansour",
      specialty: "Cardiac Surgery",
      date: "Mar 15, 2024",
      time: "10:00 AM",
      type: "Consultation"
    },
    {
      id: 2,
      doctor: "Dr. Layla Khalil",
      specialty: "Eye Surgery",
      date: "Mar 20, 2024",
      time: "2:30 PM",
      type: "Follow-up"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: "Viewed",
      target: "Cardiac Surgery Treatment",
      time: "2 hours ago",
      icon: Heart
    },
    {
      id: 2,
      action: "Contacted",
      target: "Dr. Omar Farouk",
      time: "1 day ago",
      icon: MessageCircle
    },
    {
      id: 3,
      action: "Downloaded",
      target: "Travel Information Guide",
      time: "3 days ago",
      icon: FileText
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src="" alt={user.email} />
              <AvatarFallback className="text-lg bg-primary/10">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back!
              </h1>
              <p className="text-muted-foreground">
                {user.email}
              </p>
              <Badge variant="outline" className="mt-1">
                Patient Portal
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 justify-start gap-3 hover:shadow-md transition-shadow"
                        onClick={action.action}
                      >
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.action}</span> {activity.target}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Treatment Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                    <Heart className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Cardiac Surgery</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Advanced heart procedures with world-class specialists
                    </p>
                    <Link to="/treatments/cardiac-surgery">
                      <Button size="sm" variant="outline">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                  <div className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                    <Star className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Premium Care Package</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Comprehensive medical tourism experience
                    </p>
                    <Link to="/concierge">
                      <Button size="sm" variant="outline">
                        Explore
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-3 border border-border rounded-lg">
                        <div className="font-medium text-sm">{appointment.doctor}</div>
                        <div className="text-xs text-muted-foreground">{appointment.specialty}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          {appointment.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-2">
                          {appointment.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                    <Button size="sm" className="mt-2" onClick={() => navigate('/contact')}>
                      Schedule Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Our medical coordinators are here to help with any questions.
                </p>
                <div className="space-y-2">
                  <Button size="sm" className="w-full" onClick={() => navigate('/contact')}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with Us
                  </Button>
                  <Button size="sm" variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    +20 100 1741666
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Travel Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Travel to Egypt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Get essential information for your medical trip to Egypt.
                </p>
                <Link to="/travel-info">
                  <Button size="sm" variant="outline" className="w-full">
                    View Travel Guide
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;