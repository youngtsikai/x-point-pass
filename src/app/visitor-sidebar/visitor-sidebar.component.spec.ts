import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorSidebarComponent } from './visitor-sidebar.component';

describe('VisitorSidebarComponent', () => {
  let component: VisitorSidebarComponent;
  let fixture: ComponentFixture<VisitorSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
