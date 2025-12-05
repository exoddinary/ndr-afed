"use client"

export function SubsurfaceViewer() {
    return (
        <div className="w-full h-full bg-slate-900">
            <iframe 
                src="https://www.gomsmart.com/DemoSchedule/3d/default.aspx?val=newc"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    )
}
