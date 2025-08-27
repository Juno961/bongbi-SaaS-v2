import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Book,
  Mail,
  Video,
  Send,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { bongbiApi } from "@/lib/api";

interface InquiryForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Help = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InquiryForm>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof InquiryForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 검증
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await bongbiApi.submitCustomerInquiry(formData);
      
      if (response.success) {
        toast({
          title: "문의 접수 완료",
          description: "문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.",
        });
        
        // 폼 초기화
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      }
    } catch (error: any) {
      console.error('문의 제출 오류:', error);
      
      const errorMessage = error.message || "문의 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      
      toast({
        title: "제출 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            도움말 및 지원
          </h1>
          <p className="text-muted-foreground">
            봉비서 사용법을 확인하거나 문의를 남겨 주세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                고객 지원 문의
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input 
                      id="name" 
                      placeholder="이름을 입력하세요"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">제목</Label>
                  <Input 
                    id="subject" 
                    placeholder="어떤 도움이 필요하신가요?"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">메시지</Label>
                  <Textarea
                    id="message"
                    placeholder="문제나 질문을 상세히 설명해 주세요..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      메시지 보내기
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  바로가기
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => toast({
                    title: "준비 중입니다",
                    description: "동영상 튜토리얼을 준비 중입니다. 곧 제공 예정입니다.",
                  })}
                >
                  <Video className="h-4 w-4 mr-2" />
                  동영상 튜토리얼
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => toast({
                    title: "준비 중입니다",
                    description: "사용자 매뉴얼을 준비 중입니다. 곧 제공 예정입니다.",
                  })}
                >
                  <Book className="h-4 w-4 mr-2" />
                  사용자 매뉴얼
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>연락처 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">이메일 지원</p>
                    <p className="text-sm text-muted-foreground">
                      tj11629@naver.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;
