import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Circle,
  CustomOverlayMap,
  Map,
  MapMarker,
  Polyline,
} from "react-kakao-maps-sdk";
import "./planner.css";
import axios from "axios";
import {
  // Link, useNavigate,
  useParams,
} from "react-router-dom";
import MarkerWithOverlay from "./MarkerWithOverlay";
import { useRecoilState } from "recoil";
import { loginNicknameState } from "../utils/RecoilData";
// import BasicSelect from "../utils/BasicSelect";
// import DrawPlannerPathCanvas from "./DrawPlannerPath";
import PlannerWrite from "./PlannerWrite";
import PlannerView from "./PlannerView";

const PlannerFrm = () => {
  //마커 오버레이 여닫음
  const [openOverlay, setOpenOverlay] = useState(null);
  //플래너 창 여닫음
  const [openPlanner, setOpenPlanner] = useState(true);
  //"플래너에 추가하기" 창 여닫음
  const [openPlanningModal, setOpenPlanningModal] = useState(null);
  //플래너에 추가한 장소 리스트
  const [plannedPlaceList, setPlannedPlaceList] = useState([]);
  //플래너 제목
  const [planName, setPlanName] = useState("");
  //장소 리스트
  const [placeList, setPlaceList] = useState([]);
  //유저닉네임
  const [loginNickname, setLoginNickname] = useRecoilState(loginNicknameState);
  //플래너 소유자(작성자) 여부
  const [isOwner, setIsOwner] = useState(false);

  //맵 관련 STATE
  //현재 보이는 지도 화면
  const [mapBounds, setMapBounds] = useState(null);
  //지도 중심좌표(화면 이동 시 사용)
  const [mapCenter, setMapCenter] = useState({
    lat: 37.5341338,
    lng: 126.897333254,
  });
  //유저가 클릭한 지도 위치
  const [userMarker, setUserMarker] = useState(null);
  //유저 클릭 위치를 중심으로 하는 반경 범위
  const [userRadius, setUserRadius] = useState(1000);

  //플래너 상태 판별용 STATE
  //주소에서 받은 planNo
  const { planNo } = useParams();
  //플래너 모드: view, write, null
  const [plannerMode, setPlannerMode] = useState(null);

  //↓ 작성된 useEffect 목록

  //플래너 진입 시 "새 플래너 작성"인지, "기존 플래너 열람"인지 판단
  useEffect(() => {
    if (planNo) {
      getPlanData(planNo);
      setPlannerMode("view");
    } else {
      setPlannerMode("write");
    }
  }, [planNo]);

  //작성 중(이었던) 임시 플래너를 불러오기
  useEffect(() => {
    if (planNo) return;
    const saved = window.localStorage.getItem(`${loginNickname}_cache_planner`);
    if (saved && saved !== "[]") {
      if (
        window.confirm(
          "기존에 작성하던 플래너가 남아 있습니다. 불러오시겠습니까?\n불러오지 않은 데이터는 삭제됩니다."
        )
      ) {
        const savedList = JSON.parse(saved);
        setPlannedPlaceList(savedList);
        setMapCenter(savedList[0].placeLatLng);
        setOpenPlanner(true);
      } else {
        window.localStorage.removeItem(`${loginNickname}_cache_planner`);
      }
    }
  }, []);
  //작성 중인 플래너를 임시 데이터로 저장
  useEffect(() => {
    if (planNo) return;
    window.localStorage.setItem(
      `${loginNickname}_cache_planner`,
      JSON.stringify(plannedPlaceList)
    );
  }, [plannedPlaceList]);

  //↓ 함수 및 값

  //작성된 플래너 조회 시
  const getPlanData = useCallback(() => {
    const refreshToken = window.localStorage.getItem("refreshToken");
    axios
      .get(`${process.env.REACT_APP_BACK_SERVER}/plan/verify/${planNo}`, {
        headers: {
          Authorization: refreshToken,
        },
      })
      .then((res) => {
        //플랜정보 + 플랜 내 방문지들 + 소유자 여부 반환
        const { plan, isOwner, itineraries } = res.data;

        //placeTypeId 매핑 함수
        const getPlaceTypeName = (typeId) => {
          switch (typeId) {
            case 12:
              return "관광지";
            case 14:
              return "문화시설";
            case 15:
              return "축제/행사";
            case 28:
              return "레포츠";
            case 38:
              return "쇼핑";
            case 32:
              return "숙박시설";
            case 39:
              return "음식점";
            default:
              return "기타";
          }
        };

        const mappedData = itineraries.map((item) => ({
          placeId: item.placeId,
          placeTitle: item.placeTitle,
          placeAddr: item.placeAddr,
          placeType: getPlaceTypeName(item.placeTypeId),
          placeThumb: item.placeThumb,
          placeRating: item.placeRating,
          placeReview: item.placeReview,
          placeLatLng: {
            lat: item.mapLat,
            lng: item.mapLng,
          },
          itineraryDate: item.itineraryDate,
          transport: item.transport || "",
          order: item.itineraryOrder,
        }));

        setPlanName(plan.planName ?? "untitled");
        setIsOwner(isOwner);
        setPlannedPlaceList(mappedData);
        if (mappedData.length > 0) {
          setMapCenter(mappedData[0].placeLatLng);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

  const handleDeletePlace = (odr) => {
    //1. 삭제하시겠습니까?
    if (window.confirm("삭제하시겠습니까?")) {
      //2. plannedPlace 삭제 및 order 재정렬
      const newList = plannedPlaceList.filter((item) => item.order !== odr);
      if (odr === 0 && newList.length > 0) {
        //삭제할 방문지가 맨 처음 것이라면
        newList[0].transport = "";
      }
      newList.forEach((item, i) => {
        item.order = i;
      });
      setPlannedPlaceList(newList);
    }
  };

  //메인 리턴부
  return (
    <div className="all-wrap">
      {plannerMode === "write" && (
        <PlannerWrite
          userMarker={userMarker}
          userRadius={userRadius}
          setUserRadius={setUserRadius}
          openPlanningModal={openPlanningModal}
          setOpenPlanningModal={setOpenPlanningModal}
          plannedPlaceList={plannedPlaceList}
          setPlannedPlaceList={setPlannedPlaceList}
          planName={planName}
          setPlanName={setPlanName}
          placeList={placeList}
          setPlaceList={setPlaceList}
          setOpenOverlay={setOpenOverlay}
          setOpenPlanner={setOpenPlanner}
          setMapCenter={setMapCenter}
        />
      )}
      <PlannerView
        openPlanner={openPlanner}
        setOpenPlanner={setOpenPlanner}
        plannedPlaceList={plannedPlaceList}
        setPlannedPlaceList={setPlannedPlaceList}
        planName={planName}
        setPlanName={setPlanName}
        plannerMode={plannerMode}
      />
      {plannerMode === "view" && isOwner && (
        <div className="save-plan-btn">
          <button onClick={() => setPlannerMode("write")}>수정</button>
        </div>
      )}
      <div className="map-wrap">
        <PrintMap
          openOverlay={openOverlay}
          setOpenOverlay={setOpenOverlay}
          setOpenPlanningModal={setOpenPlanningModal}
          setMapBounds={setMapBounds}
          userMarker={userMarker}
          setUserMarker={setUserMarker}
          userRadius={userRadius}
          plannedPlaceList={plannedPlaceList}
          handleDeletePlace={handleDeletePlace}
          mapCenter={mapCenter}
          plannerMode={plannerMode}
          placeList={placeList}
        />
      </div>
    </div>
  );
};

//카카오맵
const PrintMap = (props) => {
  const [openOverlay, setOpenOverlay] = [
    props.openOverlay,
    props.setOpenOverlay,
  ];
  const setOpenPlanningModal = props.setOpenPlanningModal;
  const setMapBounds = props.setMapBounds;
  const [userMarker, setUserMarker] = [props.userMarker, props.setUserMarker];
  const userRadius = props.userRadius;
  const plannedPlaceList = props.plannedPlaceList;
  const handleDeletePlace = props.handleDeletePlace;
  const mapCenter = props.mapCenter;
  const plannerMode = props.plannerMode;
  const placeList = props.placeList;

  const markableList = useMemo(() => {
    return placeList.filter(
      (item) => !plannedPlaceList.find((p) => p.placeId === item.placeId)
    );
  }, [placeList, plannedPlaceList]);

  const [mapLevel, setMapLevel] = useState(3);
  const [markersOn, setMarkersOn] = useState(true);

  return (
    <Map
      id={`kakaomap`}
      center={mapCenter}
      style={{
        // 지도의 크기
        width: "100%",
        height: "100%",
      }}
      level={mapLevel} // 지도의 확대 레벨
      onZoomChanged={(map) => {
        setMapLevel(map.getLevel());
        setMarkersOn(map.getLevel() < 8);
      }}
      //지도 클릭 시
      onClick={(map, e) => {
        if (plannerMode === "view") return;

        if (openOverlay === null) {
          //클릭 위치 좌표
          const lat = e.latLng.getLat();
          const lng = e.latLng.getLng();
          setUserMarker({ lat, lng });
        } else {
          setOpenOverlay(null);
        }
      }}
      //현재 보이는 화면 범위를 가져옴
      onBoundsChanged={(map) => {
        setMapBounds(map.getBounds());
      }}
    >
      {plannedPlaceList.length > 1 && (
        <Polyline //저장된 장소 간 직선 그리기
          path={plannedPlaceList
            .sort((a, b) => a.order - b.order)
            .map((p) => ({
              lat: p.placeLatLng.lat,
              lng: p.placeLatLng.lng,
            }))}
          strokeWeight={4}
          strokeColor={"tomato"}
          strokeOpacity={0.9}
          strokeStyle={"solid"}
        />
      )}
      {plannedPlaceList.length > 1 &&
        plannedPlaceList.slice(0, -1).map((p, idx) => {
          const next = plannedPlaceList[idx + 1];
          const midLat = (p.placeLatLng.lat + next.placeLatLng.lat) / 2;
          const midLng = (p.placeLatLng.lng + next.placeLatLng.lng) / 2;
          const rad = Math.atan2(
            next.placeLatLng.lat - p.placeLatLng.lat,
            next.placeLatLng.lng - p.placeLatLng.lng
          );
          const deg = (rad * 180) / Math.PI;

          return (
            <CustomOverlayMap
              key={"arrow-" + idx}
              position={{ lat: midLat, lng: midLng }}
            >
              <div
                className="arrow-marker"
                style={{ transform: `rotate(${-deg}deg)` }}
              >
                ➡
              </div>
            </CustomOverlayMap>
          );
        })}
      {userMarker && (
        <>
          <MapMarker
            position={userMarker}
            image={{
              src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
              size: { width: 24, height: 35 },
            }}
          />
          <Circle
            center={userMarker}
            radius={userRadius}
            strokeWeight={2}
            strokeColor={"var(--main2)"}
            strokeStyle={"solid"}
            fillColor={"var(--main4)"}
            fillOpacity={0.2}
          />
        </>
      )}
      {markersOn &&
        markableList.map((p) => {
          return (
            <MarkerWithOverlay
              key={"marker-" + p.placeId}
              place={p}
              openOverlay={openOverlay}
              setOpenOverlay={setOpenOverlay}
              setOpenPlanningModal={setOpenPlanningModal}
            />
          );
        })}
      {plannedPlaceList.map((p) => (
        <MarkerWithOverlay
          key={"planned-" + p.placeId}
          place={p}
          openOverlay={openOverlay}
          setOpenOverlay={setOpenOverlay}
          isPlanned={true}
          handleDeletePlace={handleDeletePlace}
          plannerMode={plannerMode}
        />
      ))}
    </Map>
  );
};

export default PlannerFrm;
