import React, { useState, useMemo, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  VideoCameraOutlined,
  DownOutlined,
  CalendarOutlined,
  BookOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Layout,
  Menu,
  theme,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Typography,
  Tree,
  Card,
  Divider,
  List,
  Radio,
  Tag,
  Spin,
  Empty,
  message,
} from "antd";
import { gen_schedule } from "../service/gen_schedule";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function buildTreeData(skillsObj) {
  if (!skillsObj || typeof skillsObj !== "object") return [];
  return Object.entries(skillsObj).map(([cat, subs], i) => ({
    title: cat,
    key: `cat-${i}`,
    children: (subs || []).map((s, j) => ({
      title: s,
      key: `cat-${i}-skill-${j}`,
    })),
  }));
}

const LayoutDefault = () => {
  // UI state
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Form & modal
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data state
  const [skills, setSkills] = useState({});
  const [learningPath, setLearningPath] = useState([]); // [{day, skill, subskill, youtube_links, theory, question_review: []}]
  const [selectedDay, setSelectedDay] = useState(null);
  const [userAnswers, setUserAnswers] = useState({}); // {questionId: 'A' | 'B' | ...}

  // Derived
  const treeData = useMemo(
    () => [
      {
        title: "Computer Vision",
        key: "root",
        children: buildTreeData(skills),
      },
    ],
    [skills]
  );

  const dayList = useMemo(() => {
    if (!Array.isArray(learningPath)) return [];
    return [...learningPath]
      .filter((d) => typeof d?.day === "number")
      .sort((a, b) => a.day - b.day)
      .map((d) => d.day);
  }, [learningPath]);

  const currentDayData = useMemo(() => {
    if (!Array.isArray(learningPath) || selectedDay == null) return null;
    return learningPath.find((d) => d.day === selectedDay) || null;
  }, [learningPath, selectedDay]);

  // Set default selected day when learningPath changes
  useEffect(() => {
    if (dayList.length > 0) {
      setSelectedDay((prev) => (prev == null ? dayList[0] : prev));
    } else {
      setSelectedDay(null);
    }
  }, [dayList]);

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const score = useMemo(() => {
    const qs = currentDayData?.question_review || [];
    if (!qs.length) return 0;
    let correct = 0;
    for (const q of qs) {
      if (userAnswers[q.id] === q.correct_answer) correct++;
    }
    return Math.round((correct / qs.length) * 100);
  }, [currentDayData, userAnswers]);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      // Call BE
      const res = await gen_schedule(values);
      const data = res?.data || res; // phòng trường hợp service trả res trực tiếp
      // Normalize learning_path (object -> array nếu cần)
      let lp = data?.learning_path;
      if (lp && !Array.isArray(lp) && typeof lp === "object") {
        lp = Object.values(lp);
      }
      if (!Array.isArray(lp)) lp = [];

      setSkills(data?.skills || {});
      setLearningPath(lp);
      setUserAnswers({});
      message.success("Tạo roadmap thành công");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={[
            { key: "1", icon: <UserOutlined />, label: "Schedule" },
            { key: "2", icon: <VideoCameraOutlined />, label: "Roadmap" },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <Button type="primary" onClick={showModal}>
            Open Modal
          </Button>

          <Modal
            title="What do you want to learn"
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            closable
            confirmLoading={submitting}
            destroyOnClose
          >
            <div style={{ maxWidth: 600, margin: "10px auto" }}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  goal: "I want to learn Computer Vision",
                  level: "Beginner",
                  description:
                    "This is a course to learn Computer Vision step by step",
                  estimated_hours: 40,
                }}
              >
                <Form.Item
                  label="Goal"
                  name="goal"
                  rules={[{ required: true, message: "Please enter goal" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Level"
                  name="level"
                  rules={[{ required: true, message: "Please select level" }]}
                >
                  <Select
                    options={[
                      { value: "Beginner", label: "Beginner" },
                      { value: "Medium", label: "Medium" },
                      { value: "Advance", label: "Advance" },
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Description" name="description">
                  <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item
                  label="Estimated Hours"
                  name="estimated_hours"
                  rules={[{ required: true, message: "Please enter hours" }]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Form>
            </div>
          </Modal>
        </Header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {/* Skills Roadmap */}
          <Card style={{ marginBottom: 24 }}>
            <Title
              level={2}
              style={{ textAlign: "center", marginBottom: 30, color: "#1890ff" }}
            >
              Computer Vision Skills Roadmap
            </Title>

            {Object.keys(skills).length === 0 ? (
              <Empty description="Chưa có dữ liệu kỹ năng. Hãy tạo roadmap từ Modal." />
            ) : (
              <Tree
                showLine
                switcherIcon={<DownOutlined />}
                defaultExpandAll
                treeData={treeData}
                style={{ fontSize: 16 }}
              />
            )}

            <div
              style={{
                marginTop: 30,
                padding: 20,
                backgroundColor: "#e6f7ff",
                borderRadius: 6,
              }}
            >
              <Title level={4}>Hướng dẫn sử dụng</Title>
              <p>
                Roadmap hiển thị các kỹ năng chính trong Computer Vision và các
                kỹ năng con. Mở rộng/thu gọn để xem chi tiết.
              </p>
            </div>
          </Card>

          {/* Learning Path */}
          <Card>
            <Title
              level={2}
              style={{ textAlign: "center", marginBottom: 20, color: "#52c41a" }}
            >
              <CalendarOutlined /> Lộ trình học tập
            </Title>
            <Divider />

            {learningPath.length === 0 ? (
              <Empty description="Chưa có lộ trình. Hãy tạo roadmap từ Modal." />
            ) : (
              <>
                {/* Day selector */}
                <div style={{ marginBottom: 20, textAlign: "center" }}>
                  {dayList.map((day) => (
                    <Button
                      key={day}
                      type={selectedDay === day ? "primary" : "default"}
                      shape="circle"
                      size="large"
                      style={{ margin: "0 8px 8px 0" }}
                      onClick={() => setSelectedDay(day)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>

                {/* Day content */}
                {!currentDayData ? (
                  <Spin />
                ) : (
                  <>
                    <Card
                      type="inner"
                      title={
                        <span>
                          <BookOutlined /> Ngày {currentDayData.day}:{" "}
                          {currentDayData.skill} - {currentDayData.subskill}
                        </span>
                      }
                      style={{ marginBottom: 20 }}
                    >
                      <Text strong>Lý thuyết:</Text>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {currentDayData.theory || "—"}
                      </p>

                      <Text strong>Video học tập:</Text>
                      <div>
                        {currentDayData.youtube_links ? (
                          <a
                            href={currentDayData.youtube_links}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {currentDayData.youtube_links}
                          </a>
                        ) : (
                          "—"
                        )}
                      </div>
                    </Card>

                    {currentDayData?.question_review?.length > 0 && (
                      <Card
                        type="inner"
                        title={
                          <span>
                            <QuestionCircleOutlined /> Câu hỏi ôn tập
                            <Tag color="blue" style={{ marginLeft: 10 }}>
                              Điểm: {score}%
                            </Tag>
                          </span>
                        }
                      >
                        <List
                          itemLayout="vertical"
                          dataSource={currentDayData.question_review}
                          renderItem={(q) => (
                            <List.Item>
                              <Text strong>{q.question_text}</Text>
                              <Radio.Group
                                onChange={(e) =>
                                  handleAnswerSelect(q.id, e.target.value)
                                }
                                value={userAnswers[q.id]}
                                style={{ display: "block", marginTop: 10 }}
                              >
                                {(q.options || []).map((opt) => {
                                  // opt format: "A. something"
                                  const val = (opt || "").substring(0, 1);
                                  return (
                                    <Radio
                                      key={opt}
                                      value={val}
                                      style={{
                                        display: "block",
                                        marginBottom: 8,
                                      }}
                                    >
                                      {opt}
                                    </Radio>
                                  );
                                })}
                              </Radio.Group>

                              {userAnswers[q.id] && (
                                <div style={{ marginTop: 10 }}>
                                  {userAnswers[q.id] === q.correct_answer ? (
                                    <Tag color="green">Đúng</Tag>
                                  ) : (
                                    <Tag color="red">
                                      Sai - Đáp án đúng: {q.correct_answer}
                                    </Tag>
                                  )}
                                </div>
                              )}
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutDefault;
