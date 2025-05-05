import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecuritySidebarComponent } from './security-sidebar.component';

describe('SecuritySidebarComponent', () => {
  let component: SecuritySidebarComponent;
  let fixture: ComponentFixture<SecuritySidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecuritySidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecuritySidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
