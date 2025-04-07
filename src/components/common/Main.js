import { useEffect, useState } from "react";
import IntroSlider from "./IntroSlide";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import RecommandSlider from "./RecommandSlider";
import "./main.css";
import FavoriteIcon from "@mui/icons-material/Favorite";
import axios from "axios";

const Main = () => {
  const [planCategory, setPlanCategory] = useState([
    {
      name: "인기",
      id: 1,
    },
    {
      name: "최신",
      id: 2,
    },
    {
      name: "혼자",
      id: 3,
    },
    {
      name: "여럿이",
      id: 4,
    },
  ]);
  const [onPlan, setOnPlan] = useState("인기");
  //placeType 별 조회
  const [placeType, setPlaceType] = useState([]);
  const [onPlace, setOnPlace] = useState("");
  const [onReview, setOnReview] = useState("");
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACK_SERVER}/place/type`).then((res) => {
      setPlaceType(res.data);
      setOnPlace(res.data[0].name);
    });
  }, []);
  return (
    <section className="section main-wrap">
      <IntroSlider />
      <div className="recommand-wrap">
        <div className="recommand-title">
          <h2>추천플랜</h2>
        </div>
        <div className="recommand-nav">
          <FilterNavWithPanel
            categories={planCategory}
            on={onPlan}
            setOn={setOnPlan}
          />
        </div>
        <RecommandSlider on={onPlan} />
      </div>
      <div className="recommand-wrap">
        <div className="recommand-title">
          <h2>추천 컨텐츠</h2>
        </div>
        <div className="recommand-nav">
          <FilterNavWithPanel
            categories={placeType}
            on={onPlace}
            setOn={setOnPlace}
          />
        </div>
        <RecommandSlider on={onPlace} />
      </div>
      <div className="recommand-wrap">
        <div className="recommand-title">
          <h2>인기 리뷰</h2>
        </div>
        <div className="recommand-nav">
          <FilterNavWithPanel
            categories={placeType}
            on={onReview}
            setOn={setOnReview}
          />
        </div>
        <div className="hot-review-wrap">
          <div className="main-review">
            <ReviewCard />
          </div>
          <div className="other-review-wrap">
            <div className="other-review">
              <ReviewCard />
              <ReviewCard />
            </div>
            <div className="other-review">
              <ReviewCard />
              <ReviewCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FilterNavWithPanel = ({ categories, on, setOn }) => {
  const tabIndex = categories.findIndex((type) => type.name === on); // 문자열인 on → index 변환

  const handleChange = (_, newIndex) => {
    const selected = categories[newIndex].name;
    setOn(selected);
  };

  return (
    <Box sx={{ width: "100%", bgcolor: "background.paper", p: 1 }}>
      <Tabs
        value={tabIndex === -1 ? 0 : tabIndex}
        onChange={handleChange}
        aria-label="category tabs"
        indicatorColor="primary"
        sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: "#27b778",
          },
        }}
      >
        {categories.map((category, i) => (
          <Tab key={category.id + "-" + i} label={category.name} />
        ))}
      </Tabs>
    </Box>
  );
};
const ReviewCard = () => {
  return (
    <div
      className="review-card"
      style={{
        backgroundImage: `url(/image/dora.png)`,
        backgroundSize: "cover",
        width: "100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="heart-icon">
        <FavoriteIcon style={{ color: "#4CAF50" }} />
      </div>
      <div className="card-content">
        <h3 className="title">남산순환나들길</h3>
        <div className="rating">
          <span className="stars">★★★★★</span>
          <span className="score">5.0 (22)</span>
        </div>
        <p className="category">국립공원</p>
      </div>
    </div>
  );
};

export default Main;
