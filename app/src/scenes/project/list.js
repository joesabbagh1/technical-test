import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useHistory } from "react-router-dom";
import Loader from "../../components/loader";
import LoadingButton from "../../components/loadingButton";
import ProgressBar from "../../components/ProgressBar";
import api from "../../services/api";
import { MoreIcon, Pinned } from "../../assets/Icons";

const Project = ({ project, handlePinToggle }) => {
  const [open, setOpen] = useState(false);
  const history = useHistory();

  return (
    <div className="relative">
      <div
        onClick={() => history.push(`/project/${project._id}`)}
        className="flex justify-between z-10 flex-wrap p-3 border border-[#FFFFFF] bg-[#F9FBFD] rounded-[16px] mt-3 cursor-pointer">
        <div className="flex w-full md:w-[25%] border-r border-[#E5EAEF]">
          <div className="flex flex-wrap gap-4 items-center">
            {project.logo && <img className="w-[85px] h-[85px] rounded-[8px] object-contain	" src={project.logo} alt="ProjectImage.png" />}
            <div className="flex flex-col flex-wrap flex-1">
              <div className="text-[18px] text-[#212325] font-semibold flex flex-wrap gap-2">
                <span>{project.name}</span>
                {project.pinned && (
                  <div className="rotate-45">
                    <Pinned />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-[50%] border-r border-[#E5EAEF] pl-[10px]">
          <span className="text-[14px] font-medium text-[#212325]">{project.description ? project.description : ""}</span>
        </div>
        <div className="w-full md:w-[25%]  px-[10px]">
          <span className="text-[16px] font-medium text-[#212325]">Budget consumed {project.paymentCycle === "MONTHLY" && "this month"}:</span>
          <Budget project={project} />
        </div>
      </div>
      <div className="absolute right-2 top-2 z-50">
        <button className="p-1 text-white scale-75 rounded-xl bg-[#64B5F5] text-wprojecte" onClick={() => setOpen(!open)}>
          <MoreIcon />
        </button>
        {open && (
          <div
            className="absolute cursor-pointer top-9 px-2 py-1 bg-[#64B5F5] text-white rounded-xl right-1/2 translate-x-1/2 flex justify-center shadow-sm z-50 hover:bg-opacity-75"
            onClick={() => {
              handlePinToggle(project);
              setOpen(false);
            }}>
            {project.pinned ? <span>Unpin</span> : <span>Pin</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectList = () => {
  const [projects, setProjects] = useState(null);
  const [activeProjects, setActiveProjects] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await api.get("/project");

      //sorting the projects based on pinned
      const sortedProjects = u.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

      setProjects(sortedProjects);
    })();
  }, []);

  useEffect(() => {
    const p = (projects || []).filter((p) => p.status === "active");
    setActiveProjects(p);
  }, [projects]);

  if (!projects || !activeProjects) return <Loader />;

  const handleSearch = (searchedValue) => {
    const p = (projects || []).filter((p) => p.status === "active").filter((e) => e.name.toLowerCase().includes(searchedValue.toLowerCase()));
    setActiveProjects(p);
  };

  /**
   * The `handlePinToggle` function toggles the 'pinned' property of a project, reorders the projects
   * array based on the pinned status, updates the projects state, and makes an API call to update the
   * pinned status of the project.
   * @param project - The `project` parameter is an object that represents a project. It likely has
   * properties such as `_id` (project ID), `name` (project name), and `pinned` (a boolean indicating
   * whether the project is pinned or not).
   */
  const handlePinToggle = async (project) => {
    // Toggle the 'pinned' property of the project
    project.pinned = !project.pinned;
    // Create a copy of projects array and find the index of the toggled project
    const projectsCopy = [...projects];
    const projectIndex = projectsCopy.findIndex((p) => p._id === project._id);

    console.log(projectIndex);
    // Remove the project from the array
    projectsCopy.splice(projectIndex, 1);

    // Reorder the projects array based on the pinned status
    if (project.pinned) {
      // If pinned, add it to the beginning
      projectsCopy.unshift(project);
    } else {
      // If unpinned, find its original position and insert it back
      const unpinnedProjects = projectsCopy.filter((p) => !p.pinned);
      const originalIndex = unpinnedProjects.findIndex((p) => p._id === project._id);
      projectsCopy.splice(originalIndex, 0, project);
    }

    projectsCopy.sort((a, b) => {
      if (a.pinned && !b.pinned) {
        return -1; // 'a' is pinned, move it up
      } else if (!a.pinned && b.pinned) {
        return 1; // 'b' is pinned, move it up
      } else {
        // Alphabetical sorting
        return a.name.localeCompare(b.name);
      }
    });

    setProjects(projectsCopy);
    await api.put(`/project/${project._id}`, { pinned: project.pinned });
  };

  return (
    <div className="w-full p-2 md:!px-8">
      <Create onChangeSearch={handleSearch} />
      <div className="py-3">
        {activeProjects.map((hit) => {
          return <Project key={hit._id} project={hit} handlePinToggle={handlePinToggle} />;
        })}
      </div>
    </div>
  );
};

const Budget = ({ project }) => {
  const [activities, setActivities] = useState([10, 29, 18, 12]);

  useEffect(() => {
    (async () => {
      let d = new Date();
      if (project.paymentCycle === "ONE_TIME") d = new Date(project.created_at);
      let dateQuery = "";
      if (project.paymentCycle === "ONE_TIME") {
        d = new Date(project.created_at);
        dateQuery = "gte:";
      }
      const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const { data } = await api.get(`/activity?projectId=${encodeURIComponent(project._id)}&date=${dateQuery}${date.getTime()}`);
      setActivities(data);
    })();
  }, []);

  const total = activities.reduce((acc, cur) => acc + cur.value, 0);
  const budget_max_monthly = project.budget_max_monthly;
  const width = (100 * total) / budget_max_monthly || 0;

  if (!project.budget_max_monthly) return <div className="mt-2 text-[24px] text-[#212325] font-semibold">{total.toFixed(2)}€</div>;
  return <ProgressBar percentage={width} max={budget_max_monthly} value={total} />;
};

const Create = ({ onChangeSearch }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-[10px] ">
      <div className="flex justify-between flex-wrap">
        {/* Search Input */}
        <div className="relative text-[#A0A6B1]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2">
            <button type="submit" className="p-1">
              <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-6 h-6">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </span>
          <input
            type="search"
            name="q"
            className="py-2 w-[364px] h-[48px] text-[16px] font-medium text-[black] rounded-[10px] bg-[#F9FBFD] border border-[#FFFFFF] pl-10"
            placeholder="Search"
            onChange={(e) => onChangeSearch(e.target.value)}
          />
        </div>
        {/* Create New Button */}
        <button
          className="bg-[#0560FD] text-[#fff] py-[12px] px-[20px] rounded-[10px] text-[16px] font-medium"
          onClick={() => {
            setOpen(true);
          }}>
          Create new project
        </button>
      </div>

      {open ? (
        <div
          className=" absolute top-0 bottom-0 left-0 right-0 bg-[#00000066] flex justify-center p-[1rem] z-50 "
          onClick={() => {
            setOpen(false);
          }}>
          <div
            className="w-full md:w-[60%] max-h-[200px] bg-[white] p-[25px] rounded-md"
            onClick={(e) => {
              e.stopPropagation();
            }}>
            {/* Modal Body */}
            <Formik
              initialValues={{}}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  values.status = "active";
                  const res = await api.post("/project", values);
                  if (!res.ok) throw res;
                  toast.success("Created!");
                  setOpen(false);
                } catch (e) {
                  console.log(e);
                  toast.error("Some Error!", e.code);
                }
                setSubmitting(false);
              }}>
              {({ values, handleChange, handleSubmit, isSubmitting }) => (
                <React.Fragment>
                  <div className="w-full md:w-6/12 text-left">
                    <div>
                      <div className="text-[14px] text-[#212325] font-medium	">Name</div>
                      <input className="projectsInput text-[14px] font-normal text-[#212325] rounded-[10px]" name="name" value={values.name} onChange={handleChange} />
                    </div>
                    <LoadingButton
                      className="mt-[1rem] bg-[#0560FD] text-[16px] font-medium text-[#FFFFFF] py-[12px] px-[22px] rounded-[10px]"
                      loading={isSubmitting}
                      onClick={handleSubmit}>
                      Create
                    </LoadingButton>
                  </div>
                </React.Fragment>
              )}
            </Formik>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProjectList;
