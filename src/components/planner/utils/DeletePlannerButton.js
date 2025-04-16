import { useRecoilValue } from "recoil";
import { isLoginState, loginNicknameState } from "../../utils/RecoilData";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IconButton, Tooltip } from "@mui/material";
import { Delete } from "@mui/icons-material";

const DeletePlannerButton = ({ objectNo }) => {
  const isLogin = useRecoilValue(isLoginState);
  const memberNickname = useRecoilValue(loginNicknameState);
  const navigate = useNavigate();

  const deletePlanner = (objectNo) => {
    axios
      .delete(
        `${process.env.REACT_APP_BACK_SERVER}/plan/${objectNo}/${memberNickname}`
      )
      .then((res) => {
        if (res.data == 1) {
          navigate("/mypage/planners");
        }
      })
      .catch((err) => {
        console.log(err);
        Swal.fire("삭제 실패", "잠시 후 다시 시도해주세요.", "error");
      });
  };

  const handleClick = () => {
    if (!isLogin) {
      Swal.fire({
        title: "로그인이 필요합니다",
        icon: "warning",
        text: "로그인 후 좋아하는 장소로 나드리가요!",
        confirmButtonText: "확인",
      }).then(() => navigate("/login", { replace: true }));
    } else {
      Swal.fire({
        title: "플래너를 삭제하시겠습니까?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "삭제",
        cancelButtonText: "취소",
      }).then((res) => {
        if (res.isConfirmed) {
          deletePlanner(objectNo);
        }
      });
    }
  };

  return (
    <div className="close-btn">
      <Tooltip title="삭제">
        <IconButton
          sx={{ m: 1 }}
          size="medium"
          onClick={handleClick}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Delete />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default DeletePlannerButton;
