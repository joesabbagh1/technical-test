import React, { useEffect, useState } from "react";

import api from "../services/api";

// eslint-disable-next-line react/display-name
export default ({ value, projects, onChange, ...props }) => {
  return (
    <div>
      <select
        className="w-[180px] bg-[#FFFFFF] text-[12px] text-[#212325] font-semibold py-[4px] px-[4px] rounded-[5px] border-r-[16px] border-[transparent] cursor-pointer shadow-sm"
        name="project"
        value={value || ""}
        {...props}
        onChange={(e) => {
          e.preventDefault();
          const f = projects.find((f) => e.target.value === f.name);
          onChange(f);
        }}>
        <option disabled>Project</option>
        <option value={""}>All Project</option>
        {projects &&
          projects
            .sort(function (a, b) {
              if (a.name?.toLowerCase() < b.name?.toLowerCase()) return -1;
              if (a.name?.toLowerCase() > b.name?.toLowerCase()) return 1;
              return 0;
            })
            .map((e) => {
              return (
                <option key={e.name} value={e.name}>
                  {e.name}
                </option>
              );
            })}
      </select>
    </div>
  );
};
